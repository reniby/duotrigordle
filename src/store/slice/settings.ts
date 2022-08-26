import { createAction, createReducer } from "@reduxjs/toolkit";
import { initialState } from "..";

export type SettingsState = {
  colorBlindMode: boolean;
  showTimer: boolean;
  wideMode: boolean;
  hideCompletedBoards: boolean;
  animateHiding: boolean;
  hideKeyboard: boolean;
};
export const settingsInitialState: SettingsState = {
  colorBlindMode: false,
  showTimer: false,
  wideMode: false,
  hideCompletedBoards: false,
  animateHiding: true,
  hideKeyboard: false,
};

export const updateSettings = createAction<Partial<SettingsState>>(
  "settings/updateSettings"
);

export const settingsReducer = createReducer(
  () => initialState,
  (builder) => {
    builder.addCase(updateSettings, (state, action) => {
      state.settings = {
        ...state.settings,
        ...action.payload,
      };
    });
  }
);
