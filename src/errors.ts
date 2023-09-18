function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return String(error);
}

function alertAndThrow(error: unknown) {
  alert(getErrorMessage(error));
  throw error;
}

export { getErrorMessage, alertAndThrow };
