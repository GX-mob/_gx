import chalk from "chalk";

export function log(title?: string, content?: string, formatTitle = true) {
  if (!title && !content) {
    return (title: string) => (content: string) =>
      log(title, content, typeof title === "undefined");
  }

  if (!content) {
    return console.log(title);
  }

  console.log(formatTitle ? chalk.bold.inverse(` ${title} `) : title, content);
}
