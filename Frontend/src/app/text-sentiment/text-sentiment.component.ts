import { Component } from '@angular/core';
import { TextSentimentService } from '../services/text-sentiment.service';

@Component({
  selector: 'app-text-sentiment',
  templateUrl: './text-sentiment.component.html',
  styleUrls: ['./text-sentiment.component.css']
})
export class TextSentimentComponent {
  text: string;
  sentiment: string;

  constructor(private textSentimentService: TextSentimentService) {}

  getSentiment() {
    this.textSentimentService.getSentiment(this.text).subscribe(
      response => {
        this.sentiment = response.sentiment;
      },
      error => {
        console.error('Error fetching sentiment', error);
      }
    );
  }
}
