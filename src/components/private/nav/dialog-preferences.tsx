"use client";
import { useTheme } from "next-themes";
import { Button } from "../../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "../../ui/select";

import {
  CodeLanguage,
  EditorTheme,
  SnippetVisibility,
  ThemePreference,
  Language,
} from "@/backend/prisma/generated/client";

import {
  Form,
  FormField,
  FormItem,
  FormControl,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { useGetPreferences, useUpdatePreferences } from "@/hooks/fetch";
import { zodResolver } from "@hookform/resolvers/zod";
import { UserPreferencesSchemaTypes, userPreferencesSchema } from "@/schemas";
import { useForm } from "react-hook-form";

import React from "react";

export function SettingsDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { setTheme } = useTheme();
  const { data, isLoading } = useGetPreferences();
  const { mutate: updatePreferences, isPending } = useUpdatePreferences();

  const preferences: UserPreferencesSchemaTypes = data ?? {};

  React.useEffect(() => {
    console.log("Fetched Data:", data);
    console.log("Extracted Preferences:", preferences);
  }, [data]);

  const form = useForm({
    resolver: zodResolver(userPreferencesSchema),
    defaultValues: data ?? {
      language: undefined,
      themePreference: undefined,
      editorTheme: undefined,
      defaultCodeLanguage: undefined,
      defaultSnippetVisibility: undefined,
      keyboardShortcuts: true,
      notifications: true,
    },
  });

  React.useEffect(() => {
    if (data) {
      form.reset(data);
      console.log("Editor preference:", data.editorTheme);
    }
  }, [data, form]);

  const languages = Object.values(Language);
  const codeLanguages = Object.values(CodeLanguage);
  const editorThemes = Object.values(EditorTheme);
  const snippetVisibilities = Object.values(SnippetVisibility);
  const themes = Object.values(ThemePreference);

  const languageLabels: Record<Language, string> = {
    en: "English",
    es: "Spanish",
    fr: "French",
    de: "German",
    pt: "Portuguese",
    ja: "Japanese",
    zh: "Chinese",
    ko: "Korean",
  };

  const pretty = (str: string) =>
    str
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());

  const onSubmit = async (data: UserPreferencesSchemaTypes) => {
    updatePreferences(data, {
      onSuccess: () => {
        setTheme(data.themePreference ?? "system");
        onOpenChange(false);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit preferences</DialogTitle>
          <DialogDescription>
            Make changes to your account preferences here. Click save when
            you're done.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="grid gap-4 py-4"
          >
            <FormField
              control={form.control}
              name="language"
              render={({ field }) => (
                <FormItem className="grid grid-cols-4 items-center gap-4">
                  <FormLabel className="text-right">Language</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="col-span-2 col-start-3 w-full">
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                      <SelectContent>
                        {languages.map((lang) => (
                          <SelectItem key={lang} value={lang}>
                            {languageLabels[lang]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage className="col-span-4 col-start-1" />
                </FormItem>
              )}
            />

            <FormField
              name="themePreference"
              control={form.control}
              render={({ field }) => (
                <FormItem className="grid grid-cols-4 items-center gap-4">
                  <FormLabel className="text-right">Theme</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="col-span-2 col-start-3 w-full">
                        <SelectValue placeholder="Select theme" />
                      </SelectTrigger>
                      <SelectContent>
                        {themes.map((theme) => {
                          return (
                            <SelectItem key={theme} value={theme}>
                              {pretty(theme)}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              name="defaultCodeLanguage"
              control={form.control}
              render={({ field }) => (
                <FormItem className="grid grid-cols-4 items-center gap-4">
                  <FormLabel className="col-span-2 text-left">
                    Code Language
                  </FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="col-span-2 col-start-3 w-full">
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                      <SelectContent>
                        {codeLanguages.map((lang) => {
                          return (
                            <SelectItem key={lang} value={lang}>
                              {pretty(lang)}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              name="editorTheme"
              control={form.control}
              render={({ field }) => (
                <FormItem className="grid grid-cols-4 items-center gap-4">
                  <FormLabel className="col-span-2 text-left">
                    Editor theme
                  </FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="col-span-2 col-start-3 w-full">
                        <SelectValue placeholder="Select theme" />
                      </SelectTrigger>
                      <SelectContent>
                        {editorThemes.map((theme) => {
                          return (
                            <SelectItem key={theme} value={theme}>
                              {pretty(theme)}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              name="defaultSnippetVisibility"
              control={form.control}
              render={({ field }) => (
                <FormItem className="grid grid-cols-4 items-center gap-4">
                  <FormLabel className="col-span-2 text-left">
                    Snippets Visibility
                  </FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="col-span-2 col-start-3 w-full">
                        <SelectValue placeholder="Select visibility" />
                      </SelectTrigger>
                      <SelectContent>
                        {snippetVisibilities.map((visibility) => {
                          return (
                            <SelectItem key={visibility} value={visibility}>
                              {pretty(visibility)}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </FormControl>
                </FormItem>
              )}
            />
            <DialogFooter className="mt-4">
              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? "Saving..." : "Save changes"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
