import { NextResponse } from "next/server";
import { auth } from "auth";

import { isOssEdition, isSaasOnlyPath } from "@/config/edition";

export default auth((req) => {
  if (isOssEdition() && isSaasOnlyPath(req.nextUrl.pathname)) {
    return new NextResponse(null, { status: 404 });
  }
  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
