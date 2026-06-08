import { GetServerSidePropsContext } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../pages/api/auth/[...nextauth]'

export async function requireAuth(ctx: GetServerSidePropsContext) {
  const session = await getServerSession(ctx.req, ctx.res, authOptions)
  if (!session?.user?.email) {
    return {
      redirect: { destination: '/login', permanent: false },
      props: {}
    }
  }
  return { props: { session } }
}
