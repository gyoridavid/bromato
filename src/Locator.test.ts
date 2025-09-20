import { tmpdir } from "os";
import { expect, test } from "vitest";
import fs from "fs-extra";
import os from "os";

import { fileUploadMiddleware, type Instruction } from "./Locator";
import path from "path";
import { createUniqueId } from "./utils";

test("fileUploadMiddleware processes file uploads correctly", async () => {
  const uploadDir = path.join(os.tmpdir(), createUniqueId());
  const instructions: Instruction[] = [
    {
      type: "action",
      operation: "setInputFiles",
      value: {
        extension: "txt",
        content: "SGVsbG8gd29ybGQh",
      },
    },
  ];
  fileUploadMiddleware(uploadDir)(instructions);
  const files = await fs.readdir(uploadDir);
  expect(files.length).toBe(1);
  const fileContent = await fs.readFile(`${uploadDir}/${files[0]}`, "utf-8");
  expect(fileContent).toBe("Hello world!");
  await fs.remove(uploadDir);
});

test("fileUploadMiddleware processes multiple file uploads correctly", async () => {
  const uploadDir = path.join(os.tmpdir(), createUniqueId());
  const instructions: Instruction[] = [
    {
      type: "action",
      operation: "setInputFiles",
      value: [
        {
          extension: "txt",
          content: "SGVsbG8gd29ybGQh",
        },
        {
          extension: "md",
          content: "I0hlbGxvIG1hcmtkb3duIQ==",
        },
      ],
    },
  ];
  const mappedInstructions = fileUploadMiddleware(uploadDir)(
    instructions,
  ) as Instruction[];
  expect(mappedInstructions[0].value).toBeInstanceOf(Array);
  expect((mappedInstructions[0].value as string[]).length).toBe(2);
  expect(
    (mappedInstructions[0].value as string[]).every(
      (v) => typeof v === "string",
    ),
  ).toBe(true);

  const files = await fs.readdir(uploadDir);
  expect(files.length).toBe(2);
  const fileContents = await Promise.all(
    files.map((file) => fs.readFile(`${uploadDir}/${file}`, "utf-8")),
  );
  expect(fileContents).toContain("Hello world!");
  expect(fileContents).toContain("#Hello markdown!");
  await fs.remove(uploadDir);
});
