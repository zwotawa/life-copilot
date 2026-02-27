import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'secondsToMinutes',
})
export class SecondsToMinutesPipe implements PipeTransform {
  transform(totalSeconds: number | null): string {
      if(totalSeconds != null) {
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;

        // Use padStart to ensure a two-digit display for minutes and seconds
        const formattedMinutes = minutes.toString().padStart(2, '0');
        const formattedSeconds = seconds.toString().padStart(2, '0');

        return `${formattedMinutes}:${formattedSeconds}`;
      }
      return '';
  }
}
