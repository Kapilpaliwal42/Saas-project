import { clerkMiddleware,createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server';

const isPublicRoute = createRouteMatcher([
    "/sign-up(.*)",
    "/sign-in(.*)",
    "/home"
])

const isPublicApiRoute = createRouteMatcher([
    "/api/video(.*)"
])
export default clerkMiddleware(async(auth,req)=>{
    
  const {userId} = await auth();  
  const currentUrl = new URL(req.url);
  const isHomepage = currentUrl.pathname === '/home';
  const isApiRequest = currentUrl.pathname.startsWith('/api/');

    if(userId && isPublicRoute(req) && !isHomepage){
        return NextResponse.redirect(new URL('/home',req.url));
    }
    if (!userId && !isPublicRoute(req) && !isPublicApiRoute(req)) {
    return NextResponse.redirect(new URL('/sign-in', req.url));
}

    return NextResponse.next();
})


export const config = {
  matcher:["/((?!.*\\..*|_next).*)","/",'/(api|trpc)(.*)'],
};