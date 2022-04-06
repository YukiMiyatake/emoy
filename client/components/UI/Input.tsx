import React from "react";

import styles from "./Input.module.css";

type InputProps = {
  type: "text" | "date" | "email" | "password";
  label: string;
  name: string;
};

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (props: InputProps, ref) => {
    return (
      <div className={styles["form-control"]}>
        <label htmlFor={props.name}>{props.label}</label>
        <input id={props.name} name={props.name} type={props.type} ref={ref} />
      </div>
    );
  }
);

export default Input;
