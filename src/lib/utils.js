import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import Papa from 'papaparse';

export function cn(...inputs) {
	return twMerge(clsx(inputs));
}

export async function fetchChallengesFromCSV() {
  return new Promise((resolve, reject) => {
    fetch('/Growth_Challenge_Set_Expanded.csv')
      .then(response => response.text())
      .then(csvText => {
        Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            resolve(results.data);
          },
          error: (err) => reject(err)
        });
      })
      .catch(reject);
  });
}