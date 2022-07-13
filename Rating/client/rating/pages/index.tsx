import type { NextPage } from 'next'
import Head from 'next/head'
import Image from 'next/image'
import styles from '../styles/Home.module.css'

import React, { useState, useCallback } from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import type {
  DropResult,
  DroppableProvided,
  DraggableProvided
} from "react-beautiful-dnd";


const Home: NextPage = () => {

  const data = [{name:"名前1"},{name:"名前2"},{name:"名前3"}];

  return (
    <div className={styles.container}>
      <Head>
        <title>Create Next App</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>
          League of Legends Rating System
        </h1>

        <ul>
          {data.map((value, index) => (
              <li className='p-4' key={index}>
                <span className='font-bold' >{value.name}</span>
              </li>
            ))}
        </ul>

      </main>

      <footer className={styles.footer}>
          Powered by Yojo
      </footer>
    </div>
  )
}

export default Home
