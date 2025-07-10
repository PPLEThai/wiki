<template lang="pug">
  v-card.ai-summary-card(
    v-if="summary && summary.summary"
    elevation="1"
    class="mb-4"
    :class="$vuetify.theme.dark ? 'ai-summary-dark' : 'ai-summary-light'"
  )
    v-card-title.py-2
      v-icon.mr-2(color="primary") mdi-brain
      span.body-1.font-weight-bold {{ aiSummaryTitle }}
      v-spacer
      v-chip.ml-2(
        small
        outlined
        color="primary"
      ) AI
    v-card-text.pt-2.pb-3
      .ai-summary-content(v-html="processedSummary")
      .caption.grey--text.mt-2
        span {{ aiSummaryGenerated }}
        span {{ summary.createdAt | moment('ll') }}
</template>

<script>
import gql from 'graphql-tag'
import { marked } from 'marked'
import DOMPurify from 'dompurify'

export default {
  props: {
    path: {
      type: String,
      required: true
    },
    locale: {
      type: String,
      default: 'th'
    }
  },
  data() {
    return {
      summary: null,
      loading: false
    }
  },
  computed: {
    processedSummary() {
      if (!this.summary || !this.summary.summary) return ''

      // Convert markdown to HTML and sanitize
      const html = marked(this.summary.summary)
      return DOMPurify.sanitize(html, {
        ALLOWED_TAGS: ['p', 'strong', 'em', 'ul', 'ol', 'li', 'br', 'a'],
        ALLOWED_ATTR: ['href', 'target']
      })
    },
    aiSummaryTitle() {
      return 'สรุปเนื้อหาด้วย AI'
    },
    aiSummaryGenerated() {
      return 'สร้างขึ้นเมื่อ '
    }
  },
  async mounted() {
    await this.fetchAISummary()
  },
  methods: {
    async fetchAISummary() {
      try {
        this.loading = true
        const result = await this.$apollo.query({
          query: gql`
            query getAISummary($path: String!, $locale: String!) {
              pages {
                aiSummary(path: $path, locale: $locale) {
                  summary
                  createdAt
                  locale
                }
              }
            }
          `,
          variables: {
            path: this.path,
            locale: this.locale
          },
          fetchPolicy: 'cache-first'
        })

        this.summary = result.data && result.data.pages && result.data.pages.aiSummary
      } catch (err) {
        console.warn('Failed to fetch AI summary:', err)
        this.summary = null
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<style lang="scss">
.ai-summary-card {
  border-left: 4px solid var(--v-primary-base) !important;

  .ai-summary-content {
    line-height: 1.6;

    p {
      margin-bottom: 0.75rem;

      &:last-child {
        margin-bottom: 0;
      }
    }

    ul, ol {
      margin: 0.5rem 0;
      padding-left: 1.5rem;

      li {
        margin-bottom: 0.25rem;
      }
    }

    strong {
      font-weight: 600;
    }
  }
}

.ai-summary-light {
  background-color: #f8f9ff !important;
}

.ai-summary-dark {
  background-color: rgba(25, 32, 72, 0.3) !important;
}
</style>
