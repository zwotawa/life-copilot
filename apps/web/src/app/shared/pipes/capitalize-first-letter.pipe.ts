import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'capitalizeFirstLetter',
})
export class CapitalilzeFirstLetter implements PipeTransform {
    transform(word: string | undefined): string | undefined {
        if(word) {
            if (word.length === 0) {
                return ""; // Handle empty strings gracefully
            }
            // Get the first character and capitalize it
            const firstLetter = word.charAt(0).toUpperCase();
            // Get the rest of the string from the second character onwards
            const restOfString = word.slice(1);
            // Concatenate them
            return firstLetter + restOfString;
        }
        return '';
    }
}