const APPLICATION_CONSTANTS = {
  SIGNUP_INVALID_USERNAME: `Invalid Username.
    A minimum of 2 characters are required.`,
  SIGNUP_INVALID_PASSWORD: `Invalid password.
    A minimum of 7 characters are required.`,
  SIGNUP_INVALID_EMAIL: `Invalid Email.
    Please try again!`,
  SIGNUP_EMAIL_REGISTERED: `That email is already registered.`,
  GENERAL_ERROR: `An error occured.
    Please try again.`,
  CREATE_NOTEBOOK_ERROR: `Failed to create Notebook.`,
  CREATE_NOTE_ERROR: `Failed to create Note.`,
  CREATE_USER_ERROR: `Failed to create User.`,
  CHANGE_USER_UNIQUE: `Please enter a new User Name`,
  CHANGE_USER_TOO_FEW: `Please enter a User Name which has at least 3 characters`,
  CHANGE_USER_TOO_MANY: `Please enter a User Name which has less than 10 characters`,
  CHANGE_PASS_UNIQUE: `Both passwords are the same. Please enter a new Password`,
  CHANGE_PASS_TOO_FEW: `Please enter a Password which has at least 3 characters`,
  CHANGE_PASS_TOO_MANY: `Please enter a Password which has less than 7 characters`,
  CHANGE_PASS_LENGTH: `The passwords are different`,

  // MARKDOWN
  // Special Characters to be converted during Markdown processing.
  SPECIAL_CHARACTERS: [
    { char: "(c)", display: "©" },
    { char: "(C)", display: "©" },
    { char: "(r)", display: "®" },
    { char: "(R)", display: "®" },
    { char: "(TM)", display: "™" },
    { char: "(tm)", display: "™" },
    { char: "(Tm)", display: "™" },
    { char: "(+-)", display: "±" },
    { char: "(P)", display: "℗" },
    { char: "(p)", display: "℗" },
    { char: ":crush:", display: "🥰" },
    { char: ":tear:", display: "🥲" },
  ],
  MOBILE_LAYOUT_WIDTH: 380,
  SPLITSCREEN_MINIMUM_WIDTH: 500,
  VIEWNOTE_PADDING: 69,
  VIEWNOTE_PADDING_MOBILE: 52,
};

export default APPLICATION_CONSTANTS;
