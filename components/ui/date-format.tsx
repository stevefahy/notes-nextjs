import {
  format,
  isTomorrow,
  isToday,
  isYesterday,
  isThisYear,
  isValid,
  formatDistanceToNow,
  isThisMonth,
} from "date-fns";

const formatStatusTime = (date: string | null | Date) => {
  date = date ? new Date(date) : null;

  if (!date || !isValid(date)) {
    return null;
  }

  if (isToday(date)) {
    return formatDistanceToNow(date, {
      includeSeconds: false,
      addSuffix: true,
    });
  } else if (isTomorrow(date)) {
    return "Tomorrow";
  } else if (isYesterday(date)) {
    return `Yesterday ${format(date, "p")}`;
  } else if (isThisMonth(date)) {
    return format(date, "EEE do MMMM p");
  } else if (isThisYear(date)) {
    return format(date, "EEE do MMMM, yyyy");
  } else {
    return format(date, "do MMMM, yyyy");
  }
};

export default function DateFormat({ dateString }: { dateString: string }) {
  if (!dateString) return null;
  const date_string = new Date(dateString).toISOString();

  const formatted_date = formatStatusTime(dateString);

  return (
    <time dateTime={date_string} suppressHydrationWarning>
      {formatted_date}
    </time>
  );
}
