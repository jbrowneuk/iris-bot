import { calculateReadTime, formatTimestamp } from './blog-roll';

describe('Blog roll utilities', () => {
  describe('formatTimestamp', () => {
    it('should convert a timestmp into a UTC date', () => {
      const timestamp = 43200; // Midday, 1 Jan 1970 UTC
      const formatted = formatTimestamp(timestamp);

      expect(formatted).toBe('1 January 1970');
    });

    it('should have textual representation for each month', () => {
      const dates = [
        { date: new Date(2020, 0, 1, 14), expectedString: 'January' },
        { date: new Date(2020, 1, 1, 14), expectedString: 'February' },
        { date: new Date(2020, 2, 1, 14), expectedString: 'March' },
        { date: new Date(2020, 3, 1, 14), expectedString: 'April' },
        { date: new Date(2020, 4, 1, 14), expectedString: 'May' },
        { date: new Date(2020, 5, 1, 14), expectedString: 'June' },
        { date: new Date(2020, 6, 1, 14), expectedString: 'July' },
        { date: new Date(2020, 7, 1, 14), expectedString: 'August' },
        { date: new Date(2020, 8, 1, 14), expectedString: 'September' },
        { date: new Date(2020, 9, 1, 14), expectedString: 'October' },
        { date: new Date(2020, 10, 1, 14), expectedString: 'November' },
        { date: new Date(2020, 11, 1, 14), expectedString: 'December' }
      ];

      dates.forEach((test) => {
        const formatted = formatTimestamp(test.date.getTime() / 1000);
        expect(formatted).toBe(`1 ${test.expectedString} 2020`);
      });
    });
  });

  /*
   * The algorithm for the calculate read time simply takes the word count of
   * a string and divides that by an average word per minute value of 200.
   *
   * Word count is calculated by a regex and thus do not need to be valid.
   */
  describe('calculateReadTime', () => {
    it('should display appropriate string for text less than a minute in length', () => {
      const text = 'Short text content';
      const estimatedTime = calculateReadTime(text);
      expect(estimatedTime).toBe('less than a min read');
    });

    it('should display appropriate string for text approximately a minute in length', () => {
      const text = Array(250).join('word ');
      const estimatedTime = calculateReadTime(text);
      expect(estimatedTime).toBe('1 min read');
    });

    it('should display appropriate string for text longer than a minute in length', () => {
      const text = Array(1000).join('word ');
      const estimatedTime = calculateReadTime(text);
      expect(estimatedTime).toBe('5 min read');
    });
  });
});
