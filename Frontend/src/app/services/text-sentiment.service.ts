import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TextSentimentService {

  private sentimentUrl = 'https://dummyapi.io/sentiment';

  constructor(private http: HttpClient) { }

  getSentiment(text: string): Observable<any> {
    return this.http.post<any>(this.sentimentUrl, { text });
  }
}
