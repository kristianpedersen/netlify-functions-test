import algoliasearch from 'algoliasearch'
import sanityClient, { SanityDocumentStub } from '@sanity/client'
import indexer from 'sanity-algolia'

const algolia = algoliasearch(
  'C26QC41PWH',
  "e23b64dadd4c26f8678c15a2593521fa"
);

const sanity = sanityClient({
  projectId: 'sukats6f',
  dataset: 'test',
  apiVersion: '2022-09-25',
  useCdn: false,
});

// Docs on event and context https://docs.netlify.com/functions/build/#code-your-function-2
const handler = (req, res) => {
  if (req.headers['content-type'] !== 'application/json') {
    res.status(400)
    res.json({ message: 'Bad request' })
    return
  }

  const algoliaIndex = algolia.initIndex('my-index');

  const sanityAlgolia = indexer(
    {
      post: {
        index: algoliaIndex,
        projection: `{
          title,
          "path": slug.current,
          "body": pt::text(body)
        }`,
      },
      article: {
        index: algoliaIndex,
        projection: `{
          heading,
          "body": pt::text(body),
          "authorNames": authors[]->name
        }`,
      },
    },

    (document) => {
      switch (document._type) {
        case 'post':
          return Object.assign({}, document, {
            custom: 'An additional custom field for posts, perhaps?',
          })
        case 'article':
          return {
            title: document.heading,
            body: document.body,
            authorNames: document.authorNames,
          }
        default:
          return document
      }
    }
  )

  return sanityAlgolia.webhookSync(sanity, req.body)
    .then(() => res.status(200).send("ok"))
}

module.exports = { handler }
