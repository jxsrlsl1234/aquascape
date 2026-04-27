import { NextResponse } from 'next/server';

export async function GET() {
  const env = {
    COZE_BUCKET_ENDPOINT_URL: process.env.COZE_BUCKET_ENDPOINT_URL,
    COZE_BUCKET_NAME: process.env.COZE_BUCKET_NAME,
    NODE_ENV: process.env.NODE_ENV,
  };

  return NextResponse.json({
    env,
    hasEndpoint: !!env.COZE_BUCKET_ENDPOINT_URL,
    hasBucket: !!env.COZE_BUCKET_NAME,
  });
}
