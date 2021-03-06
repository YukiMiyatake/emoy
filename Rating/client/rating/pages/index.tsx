import type { NextPage } from 'next'
import Head from 'next/head'
import Image from 'next/image'
import styles from '../styles/Home.module.css'
import { SwappableTable } from "../components/elements/SwappableTable/SwappableTable";

const Home: NextPage = () => {

  const data = {
    columns: [
      { id: "0", value: "0" },
      { id: "1", value: "1" },
      { id: "2", value: "2" },
      { id: "3", value: "3" },
      { id: "4", value: "4" },
      { id: "5", value: "5" },
      { id: "6", value: "6" },
      { id: "7", value: "7" },
      { id: "8", value: "8" },
      { id: "9", value: "9" },
    ]
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>Create Next App</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>
          Title
        </h1>

      <SwappableTable {...data} />

      </main>

      <footer className={styles.footer}>
          Powered by Yojo
      </footer>
    </div>
  )
}

export default Home
