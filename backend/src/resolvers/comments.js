import { neo4jgraphql } from 'neo4j-graphql-js'

export default {
  Query: {
    CommentByPost: async (object, params, context, resolveInfo) => {
      const { postId } = params

      const session = context.driver.session()
      const transactionRes = await session.run(`
          MATCH (comment:Comment)-[:COMMENTS]->(post:Post {id: $postId})
          RETURN comment {.id, .contentExcerpt, .createdAt}`, {
        postId
      })

      session.close()
      let comments = []
      transactionRes.records.map(record => {
        comments.push(record.get('comment'))
      })

      return comments
    }
  },
  Mutation: {
    CreateComment: async (object, params, context, resolveInfo) => {
      const { postId } = params
      delete params.postId
      const comment = await neo4jgraphql(object, params, context, resolveInfo, false)

      const session = context.driver.session()

      await session.run(`
          MATCH (post:Post {id: $postId}), (comment:Comment {id: $commentId})
          MERGE (post)<-[:COMMENTS]-(comment)
          RETURN comment {.id, .content}`, {
        postId,
        commentId: comment.id
      }
      )
      session.close()

      return comment
    }
  }
}
