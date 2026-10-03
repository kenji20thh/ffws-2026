import { redirect } from "next/navigation";

export default function PredictionsIndexPage() {
  redirect("/predictions/make");
}