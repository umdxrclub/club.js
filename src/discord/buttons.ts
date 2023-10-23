import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";

export type DiscordBaseButton = {
  label: string;
  emoji?: string;
  disabled?: boolean;
};

export type LinkButton = {
  style: ButtonStyle.Link;
  url: string;
};

export type ActionButton = {
  style:
    | ButtonStyle.Primary
    | ButtonStyle.Secondary
    | ButtonStyle.Success
    | ButtonStyle.Danger;
  customId: string;
};

export type DiscordButton = DiscordBaseButton & (ActionButton | LinkButton);

/**
 * Creates a series of action rows filled with the buttons specified in the
 * buttons array.
 *
 * @param buttons The buttons to add to the rows
 * @returns The rows with buttons
 */
export function createButtonRows(
  buttons: DiscordButton[]
): ActionRowBuilder<ButtonBuilder>[] {
  if (buttons.length > 25) {
    throw new Error("Cannot have more than 25 buttons in button rows!");
  }

  let maxRows = 5;
  let maxButtonsPerRow = 5;
  let totalButtons = Math.min(buttons.length, maxRows * maxButtonsPerRow);

  let numRows = Math.min(5, Math.ceil(buttons.length / 5));
  let rows: ActionRowBuilder<ButtonBuilder>[] = [];
  for (var r = 0; r < numRows; r++) {
    let rowStart = maxButtonsPerRow * r;
    let rowEnd = Math.min(rowStart + maxButtonsPerRow, totalButtons);
    let row = new ActionRowBuilder<ButtonBuilder>();

    for (var i = rowStart; i < rowEnd; i++) {
      let button = buttons[i];
      row.addComponents(createButton(button));
    }

    rows.push(row);
  }

  return rows;
}

export function createButton(button: DiscordButton) {
  let builder = new ButtonBuilder();

  builder = builder.setStyle(button.style);
  builder = builder.setLabel(button.label);

  if (button.emoji) builder.setEmoji(button.emoji);
  if (button.disabled) builder.setDisabled(button.disabled);

  if (button.style === ButtonStyle.Link) {
    builder.setURL(button.url);
  } else {
    builder.setCustomId(button.customId);
  }

  return builder;
}
