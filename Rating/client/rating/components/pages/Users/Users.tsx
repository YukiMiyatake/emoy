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

import App  from "./App";




import dynamic from "next/dynamic";




//const App = dynamic(() => import("./App"), { ssr: false });

const Home: NextPage = () => {
  return <App />;
};




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

// React-Adminで簡単な管理画面作れるかな？
export const Users = forwardRef<HTMLDivElement, Props>(
  (props, ref) => {
    //const { data, ...rest } = props;

    return (
      <App />
    );
  }
);
Users.displayName = "Users";
