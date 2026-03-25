let ignoreScrollEvents = false;

let edit: HTMLElement | null;
let view: HTMLElement | null;

export const initScrollSync = () => {
  edit = document.querySelector("#edit");
  view = document.querySelector("#view");
  addScrollListeners();
};

const syncScrollEdit = (
  element1: HTMLElement | null,
  element2: HTMLElement | null,
) => {
  if (element1 !== null && element2 !== null) {
    const scroll_end = element2.scrollHeight - element2.clientHeight;
    const percent =
      (element1.scrollTop / (element1.scrollHeight - element1.clientHeight)) *
      100;
    const percent_to_pos = scroll_end * (percent / 100);

    element1.onscroll = () => {
      const ignore = ignoreScrollEvents;
      ignoreScrollEvents = false;
      if (ignore) return;
      ignoreScrollEvents = true;
      element2.scrollTop = percent_to_pos;
    };
  }
};

const addScrollListeners = () => {
  if (view !== null && edit !== null) {
    edit.addEventListener("scroll", () => {
      syncScrollEdit(edit, view);
    });
  }

  if (view !== null && edit !== null) {
    view.addEventListener("scroll", () => {
      syncScrollEdit(view, edit);
    });
  }
};
