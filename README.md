# 🚀 File Generator Task Runner

Supercharge your development workflow with **File Generator Task Runner**, a powerful VS Code extension for creating files from templates and running associated tasks. Automate the generation of tests, stories, components, or any related files, all from a single, highly configurable command.

---

## ✨ Features

- **Flexible File Creation**: Generate files instantly from the File Explorer context menu, the command palette, or custom keybindings.
- **Powerful Templating**: Populate new files using custom templates with dynamic variables like `${moduleName}` and `${modulePath}`.
- **Integrated Task Runner**: Automatically execute terminal commands (e.g., run tests, start a watcher) after creating a file or on an existing one.
- **Highly Configurable Profiles**: Define multiple file generation "profiles" in your `settings.json` for different scenarios (e.g., Jest tests, C\# tests, Storybook files).
- **Smart Pathing**: Intelligently place new files next to the source, in the project root, or in any custom-defined location. It understands your project structure by looking for files like `package.json`.
- **Dynamic Task Variables**: Utilize a rich set of variables in your tasks to reference file paths, names, directories, and more.
- **Interactive User Prompts**: Configure tasks to present a Quick Pick menu, allowing you to select optional arguments before execution.

---

## ⚙️ Configuration

You can configure the extension by adding an array of profiles to `fileGenTaskRunner.configs` in your `settings.json`. Each object in the array represents a unique file generation profile that you can trigger.

### Profile Configuration (`fileGenTaskRunner.configs`)

Each profile object defines a file generation recipe.

| Property                  | Type            | Description                                                                                                                                                                      |
| ------------------------- | --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `label`                   | `string`        | **Required.** The name of the profile, shown in the Quick Pick menu.                                                                                                             |
| `description`             | `string`        | A brief description of the profile, also shown in the Quick Pick menu.                                                                                                           |
| `supportedExtension`      | `string[]`      | An array of file extensions this profile applies to (e.g., `["ts", "tsx"]`).                                                                                                     |
| `defaultLocationForFiles` | `string`        | Where to create the new file. Can be `same location as source file` or `project root`.                                                                                           |
| `customFilesLocation`     | `string`        | A specific directory path for new files, overriding `defaultLocationForFiles`.                                                                                                   |
| `rootFilenameOrExtension` | `string`        | A file name (e.g., `package.json`) or extension (e.g., `.csproj`) used to identify the project root directory. Essential for monorepos.                                          |
| `directoryName`           | `string`        | Name of a subdirectory to create for the new file (e.g., `__tests__`, `story`).                                                                                                  |
| `filesSuffix`             | `string`        | A suffix to add to the new file's name or extension (e.g., `test`, `spec`).                                                                                                      |
| `fileSuffixType`          | `string`        | How to apply the `filesSuffix`: `replace extension`, `extend extension` (e.g., `index.ts` -\> `index.test.ts`), or `append to file name` (e.g., `index.ts` -\> `indexTests.ts`). |
| `template`                | `string[]`      | An array of strings representing the content template for the new file.                                                                                                          |
| `tasks`                   | `NewFileTask[]` | An array of task objects that can be run with this profile. See the **Task Configuration** section below.                                                                        |
| `shouldSwitchToFile`      | `boolean`       | If `true` (default), automatically opens the new file after creation.                                                                                                            |
| `sourceDir`               | `string`        | A source directory name (e.g., `src`) to be excluded from the generated file's path structure.                                                                                   |

### Task Configuration (`tasks`)

The `tasks` array allows you to define one or more commands that can be run in the terminal.

| Property                | Type                       | Description                                                                                                                                                                      |
| ----------------------- | -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `label`                 | `string`                   | **Required.** The name of the task, used to identify it.                                                                                                                         |
| `command`               | `string`                   | The command to execute in the terminal (e.g., `npm test`, `jest`).                                                                                                               |
| `args`                  | `string[]`                 | An array of arguments to pass to the command. You can use variables here.                                                                                                        |
| `runTaskOnFileCreation` | `boolean`                  | If `true` (default), the task runs immediately after a new file is created. If `false`, it only runs when triggered on an existing file.                                         |
| `terminalInstanceType`  | `string`                   | How to manage terminals: `label` (reuse terminal per task label), `command` (reuse per unique command), or `new` (always create a new terminal). Default is `label`.             |
| `userInputPrompt`       | `object[]` or `object[][]` | Prompts the user with a Quick Pick to select additional arguments. Use a 2D array for sequential prompts.                                                                        |
| `checkIfArgPathExist`   | `string[]`                 | An array of argument prefixes (e.g., `--config=`). The task will only include the argument if the resolved file path exists.                                                     |
| `shouldSwitchToFile`    | `boolean`                  | If `true` (default), focuses the editor on the target file before running the task.                                                                                              |
| `useForwardSlash`       | `boolean`                  | If `true` (default), converts all backslashes `\` in paths to forward slashes `/`, which is useful for cross-platform compatibility (especially on Windows for tools like Jest). |

---

## 💡 Example Configuration

Here's a complete example for a generic test runner (like Jest or Vitest) in a Node.js project. Place this in your `settings.json`.

```json
{
  "fileGenTaskRunner.configs": [
    {
      // The profile label, shown in the command palette.
      "label": "Generic Tests",
      "description": "Generic Test Runner for Jest/Vitest",

      // This profile will activate for these file types.
      "supportedExtension": ["ts", "tsx", "js", "jsx"],

      // Find the nearest 'package.json' to determine the project root.
      "rootFilenameOrExtension": "package.json",

      // Create test files in the project root.
      "defaultLocationForFiles": "project root",

      // Place new test files inside a 'test' directory.
      "directoryName": "test",

      // When creating a path like 'root/test/components/button.test.ts' from 'root/src/components/button.ts',
      // the 'src' part will be removed.
      "sourceDir": "src",

      // Adds '.test' to the file's extension. E.g., 'component.tsx' -> 'component.test.tsx'
      "filesSuffix": "test",
      "fileSuffixType": "extend extension",

      // An array of tasks that can be run for this profile.
      "tasks": [
        {
          "label": "Test current file (node)",
          "command": "npm --prefix ${rootDirPath} test ${filePathFromRoot}",
          "runTaskOnFileCreation": false // Only run when explicitly chosen.
        },
        {
          "label": "Watch current file (node)",
          "command": "npm --prefix ${rootDirPath} run test:watch ${filePathFromRoot}",
          "runTaskOnFileCreation": true, // Run automatically when a new test file is created.
          "userInputPrompt": [
            // Ask the user if they want to add '--coverage'.
            [{ "label": "--coverage" }]
          ]
        }
      ]
    }
  ]
}
```

### Keybindings (`keybindings.json`)

To trigger a task directly, create a keybinding and pass the task `label` as an argument.

```json
[
  {
    "key": "ctrl+alt+t",
    "command": "fileGenTaskRunner.run",
    "args": "Test current file (node)" // This must match a task 'label' from your settings.
  },
  {
    "key": "ctrl+alt+w",
    "command": "fileGenTaskRunner.run",
    "args": "Watch current file (node)"
  }
]
```

---

## 🧩 Variables

You can use variables in both the `template` and `tasks` configurations to dynamically insert paths and names.

### Template Variables

These variables are available inside the `template` string array.

| Variable        | Example Output                 | Description                                                    |
| --------------- | ------------------------------ | -------------------------------------------------------------- |
| `${moduleName}` | `MyComponent`                  | The name of the source file without its extension.             |
| `${modulePath}` | `../../components/MyComponent` | The relative import path from the new file to the source file. |

**Example Template:**

```json
{
  "template": [
    "import { ${moduleName} } from '${modulePath}';",
    "",
    "describe('${moduleName}', () => {",
    "  it('should render correctly', () => {",
    "    // Arrange",
    "    // Act",
    "    // Assert",
    "  });",
    "});"
  ]
}
```

### Task Variables

These variables can be used in the `command` and `args` of a task. They reference the **newly created file**.

| Variable                 | Example (`/workspace/test/utils.test.ts`) | Description                                                             |
| ------------------------ | ----------------------------------------- | ----------------------------------------------------------------------- |
| `${outputFilePath}`      | `/workspace/test/utils.test.ts`           | The full, absolute path to the file.                                    |
| `${relativeFilePath}`    | `test/utils.test.ts`                      | The file path relative to the workspace root.                           |
| `${fileDirPath}`         | `/workspace/test`                         | The absolute path of the directory containing the file.                 |
| `${fileNameWithExt}`     | `utils.test.ts`                           | The name of the file, including its extension.                          |
| `${fileNameWithoutExt}`  | `utils.test`                              | The name of the file, without its extension.                            |
| `${fileExtension}`       | `.ts`                                     | The file's extension.                                                   |
| `${rootDirPath}`         | `/workspace`                              | The full path to the identified project root (`package.json` location). |
| `${filePathFromRoot}`    | `test/utils.test.ts`                      | The file path relative to the identified project root.                  |
| `${fileDirPathFromRoot}` | `test`                                    | The directory path relative to the identified project root.             |

---

## 📄 License

This extension is licensed under the [MIT License](https://www.google.com/search?q=LICENSE).
