"use server";
import { actionClient } from "./safe-action";

import { formSchema } from "@/lib/form-schema";

export const serverAction = actionClient
  .inputSchema(formSchema)
  .action(async ({ parsedInput }) => {
    // TODO: connexion Odoo 19 CRM — création lead (Source: Landing Page Dorevia, Canal: Contact page)
    // eslint-disable-next-line no-console
    console.log("Contact form submission:", parsedInput);
    return {
      success: true,
      message: "Message envoyé",
    };
  });
