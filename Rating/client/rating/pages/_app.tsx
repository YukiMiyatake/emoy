import Head from "next/head";
import Script from "next/script";
import '../styles/globals.css'
import type { AppProps } from 'next/app'
import { useEffect } from "react";

function MyApp({ Component, pageProps }: AppProps) {

  useEffect(() => { /* アプリ起動時に1回だけの処理 */ }, []);

  return (
  <>
  <Head>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-EVSTQN3/azprG1Anm3QDgpJLIm9Nao0Yz1ztcQTwFspd3yD65VohhpuuCOmLASjC" crossOrigin="anonymous" />
  </Head>
  <Script src="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/js/bootstrap.bundle.min.js" integrity="sha384-MrcW6ZMFYlzcLA8Nl+NtUVF0sA7MsXsP1UyJoMp4YLEuNSfAP+JcXn/tWtIaxVXM" crossOrigin="anonymous"></Script>
  <Component {...pageProps} />
  </>
  );
}

export default MyApp


