import type { NextPage } from 'next'
import Head from 'next/head'
import Image from 'next/image'
import styles from '../styles/Home.module.css'
import { SwappableTable } from "../components/elements/SwappableTable/SwappableTable";

const Home: NextPage = () => {

  const data = {
    columns: [
      { id: "column-1", value: "column 1" },
      { id: "column-2", value: "column 2" },
      { id: "column-3", value: "column 3" },
      { id: "column-4", value: "column 4" },
      { id: "column-5", value: "column 5" },
    ],
    rows: [
      ["1", "2", "3", "4", "5"],
      ["1", "2", "3", "4", "5"],
      ["1", "2", "3", "4", "5"],
      ["1", "2", "3", "4", "5"],
      ["1", "2", "3", "4", "5"],
    ],
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
