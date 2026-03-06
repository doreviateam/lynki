package runner

import (
	"strconv"
	"time"
)

func PeriodDates(period string) (dateStart, dateEnd string, err error) {
	return ResolvePeriod(period, "UTC")
}

// ResolvePeriod résout period → (date_start, date_end) dans le timezone donné.
// Défaut INSIGHTS_TIMEZONE : Europe/Paris. Utilisé par GET /diva/insights.
func ResolvePeriod(period, timezone string) (dateStart, dateEnd string, err error) {
	loc, err := time.LoadLocation(timezone)
	if err != nil {
		loc = time.UTC
	}
	now := time.Now().In(loc)
	today := now.Format("2006-01-02")
	year := now.Year()
	month := now.Month()

	switch period {
	case "YTD", "ytd":
		return strconv.Itoa(year) + "-01-01", today, nil
	case "MTD", "mtd":
		firstOfMonth := time.Date(year, month, 1, 0, 0, 0, 0, loc)
		return firstOfMonth.Format("2006-01-02"), today, nil
	case "current_month":
		firstOfMonth := time.Date(year, month, 1, 0, 0, 0, 0, loc)
		lastOfMonth := time.Date(year, month+1, 0, 0, 0, 0, 0, loc)
		return firstOfMonth.Format("2006-01-02"), lastOfMonth.Format("2006-01-02"), nil
	default:
		return "", "", nil
	}
}
