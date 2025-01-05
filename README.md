# Obsidian Variable Manager

A plugin for Obsidian that allows you to define and use variables in your notes with real-time evaluation and preview.

## Demo
![Demo](https://github.com/HgggFire/obsidian_variable_manager/blob/main/demo.gif)

## Features

- Define variables using the syntax `%%variable=value%%`
- Reference variables using `{{variable}}`
- Real-time preview of variable values
- Support for mathematical expressions
- Visual indication of which variable is being edited

## Usage

1. Define a variable:
```markdown
%%price=100%%
%%tax=0.2%%
%%total=price * (1 + tax)%%
```

2. Reference variables anywhere in your note:
```
The total price is {{total}}
```

3. Update the variable value and the references will be updated automatically.

## Installation

1. Open Obsidian Settings
2. Go to Community Plugins and disable Safe Mode
3. Click Browse and search for "Variable Manager"
4. Install the plugin
5. Enable the plugin in your list of installed plugins