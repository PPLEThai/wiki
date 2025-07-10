const { BigQuery } = require('@google-cloud/bigquery')

/* global WIKI */

module.exports = {
  bigQuery: null,
  dataset: null,
  table: null,

  /**
   * Initialize BigQuery client
   */
  async init() {
    try {
      // Initialize BigQuery client
      if (process.env.GOOGLE_CLOUD_PROJECT || WIKI.config.bigquery?.projectId) {
        this.bigQuery = new BigQuery({
          projectId: WIKI.config.bigquery?.projectId || process.env.GOOGLE_CLOUD_PROJECT,
          keyFilename: WIKI.config.bigquery?.keyFilename || process.env.GOOGLE_APPLICATION_CREDENTIALS
        })

        const datasetId = WIKI.config.bigquery?.datasetId || 'wiki_data'
        const tableId = WIKI.config.bigquery?.tableId || 'ai_summaries'

        this.dataset = this.bigQuery.dataset(datasetId)
        this.table = this.dataset.table(tableId)

        WIKI.logger.info('BigQuery client initialized successfully.')
      } else {
        WIKI.logger.warn('No BigQuery configuration found, AI summaries will be disabled.')
      }
    } catch (err) {
      WIKI.logger.warn('Failed to initialize BigQuery client, AI summaries will be disabled:', err.message)
      this.bigQuery = null
    }
  },

  /**
   * Get AI summary for a page
   * @param {String} path - Page path
   * @param {String} locale - Page locale
   * @returns {Promise<Object>} AI summary data
   */
  async getAISummary(path, locale = 'th') {
    if (!this.bigQuery) {
      return null
    }

    try {
      const query = `
        SELECT pageId, path, summary, locale, createdAt
        FROM \`${this.bigQuery.projectId}.${this.dataset.id}.${this.table.id}\`
        WHERE path = @path AND locale = @locale
        ORDER BY createdAt DESC
        LIMIT 1
      `

      const options = {
        query,
        params: {
          path: path,
          locale: locale
        }
      }

      const [rows] = await this.bigQuery.query(options)

      if (rows && rows.length > 0) {
        return {
          summary: rows[0].summary,
          createdAt: rows[0].createdAt,
          locale: rows[0].locale
        }
      }

      return null
    } catch (err) {
      WIKI.logger.warn(`Failed to fetch AI summary for path ${path}:`, err.message)
      return null
    }
  },

  /**
   * Get AI summaries for multiple pages
   * @param {Array} paths - Array of page paths
   * @param {String} locale - Page locale
   * @returns {Promise<Array>} Array of AI summary data
   */
  async getAISummaries(paths, locale = 'th') {
    if (!this.bigQuery || !paths || paths.length === 0) {
      return []
    }

    try {
      const pathsStr = paths.map(p => `'${p}'`).join(',')
      const query = `
        SELECT pageId, path, summary, locale, createdAt
        FROM \`${this.bigQuery.projectId}.${this.dataset.id}.${this.table.id}\`
        WHERE path IN (${pathsStr}) AND locale = @locale
        ORDER BY createdAt DESC
      `

      const options = {
        query,
        params: {
          locale: locale
        }
      }

      const [rows] = await this.bigQuery.query(options)

      return rows.map(row => ({
        path: row.path,
        summary: row.summary,
        createdAt: row.createdAt,
        locale: row.locale
      }))
    } catch (err) {
      WIKI.logger.warn(`Failed to fetch AI summaries:`, err.message)
      return []
    }
  }
}
