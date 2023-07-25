import React, {
  ComponentPropsWithoutRef,
  DragEventHandler,
  forwardRef,
  useEffect,
  useMemo,
} from "react";
import Select from "react-select";
import type { NextPage } from 'next'
import Head from 'next/head'
import Image from 'next/image'
import styles from '../../../styles/Home.module.css'
import { SwappableTable, Props } from "../../elements/SwappableTable/SwappableTable";

/*
export type Props = Readonly<
  {
    //blue: { id: string; value: string }[];
    //red: { id: string; value: string }[];
    columns: { id: string; value: string }[];
    //rows: string[][];
  } & Omit<ComponentPropsWithoutRef<"div">, "className">
>;
*/

export const Users = forwardRef<HTMLDivElement, Props>(
  (props, ref) => {
    //const { data, ...rest } = props;

    return (
      <div className={styles.container}>
        <main className={styles.main}>
          <h1 className={styles.title}>
            Users
          </h1>

        <SwappableTable {...props} />

        </main>

        <footer className={styles.footer}>
            Powered by Yojo
        </footer>
      </div>
    );
  }
);
Users.displayName = "Matching";
