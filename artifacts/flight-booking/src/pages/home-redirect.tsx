import { Show } from "@clerk/react";
import { Redirect } from "wouter";
import LandingPage from "./landing";

export default function HomeRedirect() {
  return (
    <>
      <Show when="signed-in">
        <Redirect to="/app" />
      </Show>
      <Show when="signed-out">
        <LandingPage />
      </Show>
    </>
  );
}
