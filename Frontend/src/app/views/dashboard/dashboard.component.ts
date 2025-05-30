import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, signal, WritableSignal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule, NgStyle } from '@angular/common';
import {
  ButtonDirective,
  AlertComponent,
  CardBodyComponent,
  CardComponent,
  CardHeaderComponent,
  ColComponent,
  ColDirective,
  FormControlDirective,
  FormDirective,
  FormLabelDirective,
  GutterDirective,
  ListGroupModule,
  ListGroupDirective, 
  ListGroupItemDirective,
  NavComponent,
  NavItemComponent,
  NavLinkDirective,
  RowComponent,
  RowDirective,
  TableDirective,
  TextColorDirective,
  PaginationComponent,
  PageItemComponent,
  PageLinkDirective
} from '@coreui/angular';
import { ChartjsComponent } from '@coreui/angular-chartjs';
import { IChartProps } from './dashboard-charts-data'; 
import { ChartData } from 'chart.js';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { ChartOptions } from 'chart.js';
import {   SAMPLE_PREDICTION_HISTORY,SAMPLE_CSV_FILES,SAMPLE_PENDING_FILES,SAMPLE_MY_FILES} from './datafiles';
import { PredictionService } from './prediction.service';
import { SubscriptionService } from '../../services/subscription.service';
import { CheckSubscriptionResponse } from './check-subscription-response.interface';
import { filter, interval, Subscription, takeWhile } from 'rxjs';
import { ActivatedRoute, NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { FilesResponse, FilesResponseWithChart, PredictionHistoryResponse, UserDataResponse, UserDataResponseWithChart } from './prediction.interface';

@Component({
  selector: 'app-dashboard',
  templateUrl: 'dashboard.component.html',
  styleUrls: ['dashboard.component.scss'],
  imports: [
    CommonModule,
    PaginationComponent,
    PageItemComponent,
    PageLinkDirective,
    HttpClientModule,
    NavComponent,
    NavItemComponent,
    NavLinkDirective,
    TextColorDirective,
    CardComponent,
    CardBodyComponent,
    ReactiveFormsModule,
    ChartjsComponent,
    CardHeaderComponent,
    TableDirective,
    RowComponent,
    ColComponent,
    ListGroupDirective,
    ListGroupItemDirective,
    FormsModule,
    FormDirective,
    FormLabelDirective,
    FormControlDirective,
    ButtonDirective,
    AlertComponent,
  ],
})
export class DashboardComponent implements OnInit {
  private _cachedChartData: ChartData | null = null;
  private _lastPredictionTimeStamp: Date = new Date(); // Initialize with current date
  private selectedHistoryItem: any = null;
  private fileStatusSubscriptions = new Map<string, Subscription>();

  public activeTab = 'single';
  public activeCsvFile = ''; // Track active CSV file
  public mainChart: IChartProps = { type: 'line' };
  public mainChartRef: WritableSignal<any> = signal(undefined);
  public chart: Array<IChartProps> = [];
  public fileSearchQuery: string = '';
  public filteredFiles: FilesResponse[] = [];
  public pageSize: number = 10;
  public currentPage: number = 0;
  public Math = Math; // Make Math available to the template
  public isProcessingSinglePrediction: boolean = false;
  public historyPageSize: number = 5;
  public historyCurrentPage: number = 0;
  public selectedCategories: any[] = [];
  public showCategoryModal: boolean = false;

  public isUserSubscribed: boolean = false; // NEW property to track subscription
  public loggedInUsername: string | null = null; // NEW property to store username
  public userEmailForBulk: string = ''; // Property to bind to an email input for bulk
                                        // (Or get email associated with loggedInUsername if available)
  public isLoadingBulkUpload: boolean = false; // Specific loading for bulk

  public isLoadingPageData: boolean = false;
  public currentFileData: any[] = [];
  public currentFilePagination: any = null;

  public lastSinglePrediction: PredictionHistoryResponse | null = null;
  // Pie chart options
  public pieChartOptions: ChartOptions = {
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
      },
    },
  };

  options = {
    maintainAspectRatio: false,
  };

  // Add this inside your component class
  public pendingFiles: FilesResponse[] = [];
  public myFiles: FilesResponseWithChart[] = [];
  public csvFiles: FilesResponseWithChart[] = [];
  public singlePredictionHistory: PredictionHistoryResponse[] = [];
  public isLoadingFile: boolean = false;
  public disableOtherMyFiles: boolean = false;
  public chartInitializationDelay = 1500; // Increased delay for chart initialization
  public isChartReady: boolean = false;
  public chartKey: string = ''; // Add this to force chart recreation

  constructor(
    private http: HttpClient,
    private predictionService: PredictionService,
    private subscriptionService: SubscriptionService, // Add this
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  private resetLoadingState(): void {
    this.isLoadingFile = false;
    this.disableOtherMyFiles = false;
    this.isChartReady = true;
    this.cdr.detectChanges();
  }

  get totalPages(): number {
    if (this.activeTab === 'bulk') {
      const totalItems = this.currentCsvFile?.data?.length || 0;
      return Math.ceil(totalItems / this.pageSize);
    }

    // For history pagination
    return Math.ceil(
      this.singlePredictionHistory.length / this.historyPageSize
    );
  }

  changePage(page: number, target: 'bulk' | 'history'): void {
    if (target === 'bulk') {
      this.currentPage = page;
    } else {
      this.historyCurrentPage = page;
    }
  }

  public singlePredictionForm = new FormGroup({
    textInput: new FormControl('', { nonNullable: true }),
  });

  public predictionForm = new FormGroup({
    text: new FormControl('', { nonNullable: true }),
  });
  public isPredicting: boolean = false;

  public fileUploadForm = new FormGroup({
    csvFile: new FormControl<File | null>(null),
    fileName: new FormControl(''),
  });

  chartRadarData: ChartData = {
    labels: [
      'Positive',
      'Slightly Positive',
      'Neutral',
      'Slightly Negative',
      'Negative',
    ],
    datasets: [
      {
        label: 'Sentiment Distribution',
        backgroundColor: 'rgba(51, 153, 255, 0.2)',
        borderColor: 'rgba(51, 153, 255, 1)',
        pointBackgroundColor: 'rgba(51, 153, 255, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(51, 153, 255, 1)',
        data: [92, 65, 30, 15, 8],
      },
      {
        label: 'Threshold',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        borderColor: 'rgba(255, 99, 132, 1)',
        pointBackgroundColor: 'rgba(255, 99, 132, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(255, 99, 132, 1)',
        data: [50, 50, 50, 50, 50],
      },
    ],
  };

  ngOnInit(): void {
    // 1. Get the initial activeTab from route data
    this.route.data.subscribe((data) => {
      if (data['activeTab']) {
        this.activeTab = data['activeTab'];
        console.log('Active tab from route data:', this.activeTab);
      }
    });

    // 2. Update activeTab on URL changes without full reload
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        const url = this.router.url;

        if (url.includes('/dashboard/bulk')) {
          this.activeTab = 'bulk';
        } else if (url.includes('/dashboard/single')) {
          this.activeTab = 'single';
        }

        // Force change detection to update UI without full reload
        this.cdr.detectChanges();
      });

    

    // Get user ID for API calls
    const userId =
      localStorage.getItem('userId') ||
      this.extractUserIdFromToken() ||
      'default-user-id';

    this.subscriptionService.checkBackendSubscriptionStatus();

    this.predictionService.getUserData(userId).subscribe({
      next: (userData: UserDataResponseWithChart) => {
        console.log('Received user data:', userData);

        // Set prediction history
        this.singlePredictionHistory = userData.predictionHistory || [];

        // Set initial prediction for display
        if (this.singlePredictionHistory.length > 0) {
          this.lastSinglePrediction = { ...this.singlePredictionHistory[0] };
          this.selectedHistoryItem = this.singlePredictionHistory[0];
        }

        // Set pending and completed files with chart data
        this.pendingFiles = userData.pendingFiles || [];
        this.myFiles = userData.completedFiles || [];
        this.filteredFiles = this.myFiles;

        // Start periodic checking
        this.startPeriodicFileCheck();

        console.log('Processed data:', {
          predictionHistory: this.singlePredictionHistory.length,
          pendingFiles: this.pendingFiles.length,
          completedFiles: this.myFiles.length,
        });
      },
      error: (error) => {
        console.error('Error loading user data:', error);
        // Handle error...
      },
    });
  }

  showHistoryItemChart(prediction: any): void {
    this.selectedHistoryItem = prediction;

    // Update the current chart with this prediction's data
    this.lastSinglePrediction = {
      text: prediction.text,
      final_prediction: prediction.final_prediction,
      confidence: prediction.confidence,
      sentiment_scores: prediction.sentiment_scores,
      timestamp: prediction.timestamp,
    };

    // Clear the cache to force chart update
    this._cachedChartData = null;
  }

  isSelectedHistoryItem(prediction: any): boolean {
    return (
      this.selectedHistoryItem &&
      this.selectedHistoryItem.timestamp === prediction.timestamp
    );
  }

  filterFiles(): void {
    if (!this.fileSearchQuery) {
      this.filteredFiles = this.myFiles;
      return;
    }

    const query = this.fileSearchQuery.toLowerCase();
    this.filteredFiles = this.myFiles.filter((file) =>
      file.name.toLowerCase().includes(query)
    );
  }

  clearFileSearch(): void {
    this.fileSearchQuery = '';
    this.filterFiles();
  }

  selectCsvFile(fileId: string): void {
    // Prevent switching if loading
    if (this.isLoadingFile) {
      return;
    }

    // Additional check to prevent rapid switching
    if (!this.isChartReady && this.activeCsvFile) {
      return;
    }

    // Set loading state even for tab switching to existing files
    this.isLoadingFile = true;
    this.disableOtherMyFiles = true;
    this.isChartReady = false;

    this.activeCsvFile = fileId;
    this.currentPage = 0; // Reset pagination when switching files
    this.chartKey = `${fileId}-${Date.now()}`; // Force chart recreation

    // Force change detection
    this.cdr.detectChanges();

    // Short delay to ensure chart properly switches
    setTimeout(() => {
      this.isLoadingFile = false;
      this.disableOtherMyFiles = false;
      this.isChartReady = true;
      this.cdr.detectChanges();
    }, 600);
  }

  get currentCsvFile(): FilesResponseWithChart {
    return (
      this.csvFiles.find((file) => file.id === this.activeCsvFile) || {
        id: '',
        name: '',
        timestamp: new Date(),
        data: [], // Ensure data is always an array, never undefined
      }
    );
  }

  predictSingleText(): void {
    const textValue = this.singlePredictionForm.get('textInput')?.value;
    if (!textValue || textValue.trim() === '') {
      return;
    }

    this.isProcessingSinglePrediction = true;

    this.predictionService.predictText(textValue).subscribe({
      next: (response) => {
        try {
          // Handle sentiment_scores array format
          let categories: { name: string; value: number }[] = [];

          if (Array.isArray(response.sentiment_scores)) {
            categories = response.sentiment_scores.map((score) => {
              // Normalize the name (handle lowercase "neutral")
              let normalizedName = score.name;
              if (score.name.toLowerCase() === 'neutral') {
                normalizedName = 'Neutral';
              }

              // Convert decimal to percentage if value is less than or equal to 1
              let normalizedValue = score.value;
              if (normalizedValue <= 1) {
                normalizedValue = Number((normalizedValue * 100).toFixed(2));
              }

              return {
                name: normalizedName,
                value: normalizedValue,
              };
            });
          } else if (
            response.sentiment_scores &&
            typeof response.sentiment_scores === 'object'
          ) {
            // Handle object format (backup)
            categories = Object.entries(response.sentiment_scores).map(
              ([name, value]) => ({
                name: name.toLowerCase() === 'neutral' ? 'Neutral' : name,
                value:
                  Number(value) <= 1
                    ? Number((Number(value) * 100).toFixed(2))
                    : Number(value),
              })
            );
          }

          // Use the confidence from the response, or calculate from highest sentiment score
          let confidence = response.confidence || 0;

          // If confidence is in decimal format, convert to percentage
          if (confidence <= 1) {
            confidence = Number((confidence * 100).toFixed(2));
          }

          // If no confidence provided, use highest sentiment score
          if (!confidence && categories.length > 0) {
            confidence = Math.max(...categories.map((c) => c.value));
          }
      next: (result) => {
        const categories = result.sentiment_scores
          ? Object.entries(result.sentiment_scores).map(([name, value]) => ({
              name: name === 'neutral' ? 'Neutral' : name,
              value: typeof value === 'number' ? Number((value * 100).toFixed(2)) : 0,
            }))
          : [];

        const confidence =
          result.sentiment_scores &&
          result.final_prediction &&
          result.final_prediction in result.sentiment_scores
            ? Number(((Number(result.sentiment_scores[result.final_prediction as keyof typeof result.sentiment_scores]) || 0) * 100).toFixed(2))
            : 0;

          const processedPrediction = {
            text: textValue,
            final_prediction: response.final_prediction,
            confidence: confidence,
            sentiment_scores: categories,
            timestamp: new Date(),
          };
        const prediction = {
          text: textValue,
          result: result.final_prediction || 'Unknown',
          confidence: confidence,
          categories: categories,
          timestamp: new Date(),
          rawResponse: result,
        };

          console.log('Processed prediction:', prediction);

          // Save prediction to history via API
          this.predictionService.savePredictionToHistory(prediction);

          // Get user ID from localStorage or token
          const userId =
            localStorage.getItem('userId') ||
            this.extractUserIdFromToken() ||
            'default-user-id';

          // Fetch updated prediction history from API
          this.predictionService.getPredictionHistory(userId).subscribe({
            next: (historyResponse) => {
              console.log('Updated history response:', historyResponse);

              // Update prediction history with API response
              if (historyResponse && historyResponse.predictions) {
                this.singlePredictionHistory = historyResponse.predictions;
              }

              // Set the latest prediction for display
              if (this.singlePredictionHistory.length > 0) {
                this.lastSinglePrediction = this.singlePredictionHistory[0];
                this.selectedHistoryItem = this.singlePredictionHistory[0];
              }

              this.historyCurrentPage = 0;
              this._cachedChartData = null;
              this.singlePredictionForm.reset();

              // Force change detection to update UI
              this.cdr.detectChanges();
            },
            error: (historyError) => {
              console.error(
                'Error fetching updated prediction history:',
                historyError
              );

              // Fallback: add prediction to local history if API call fails
              this.singlePredictionHistory.unshift(prediction);
              this.lastSinglePrediction = {
                text: prediction.text,
                final_prediction: prediction.result,
                confidence: prediction.confidence,
                sentiment_scores: prediction.categories,
                timestamp: prediction.timestamp,
              };
              this.selectedHistoryItem = prediction;
              this.historyCurrentPage = 0;
              this._cachedChartData = null;
              this.singlePredictionForm.reset();
              this.cdr.detectChanges();

              alert(
                'Prediction saved, but failed to refresh history. Please refresh the page to see updated history.'
              );
            },
          });
        } catch (err) {
          console.error('Error processing prediction result:', err);
          alert('Failed to process prediction result. Please try again.');
          this.isProcessingSinglePrediction = false;
        }
      },
      error: (error) => {
        console.error('[DEBUG] Error in predictSingleText:', error);
        this.isProcessingSinglePrediction = false;

        // More user-friendly error message
        if (error.status === 0) {
          alert(
            'Network error. Please check your internet connection and try again.'
          );
        } else if (error.status === 429) {
          alert('Too many requests. Please wait a moment and try again.');
        } else {
          alert(
            `Failed to process prediction: ${error.message || 'Unknown error'}`
          );
        }
      },
      complete: () => {
        // Ensure loading state is reset regardless of success/error
        this.isProcessingSinglePrediction = false;
      },
    });
  }

  // Helper method to extract user ID from JWT token
  private extractUserIdFromToken(): string | null {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return null;

      // Simple JWT decode (you might want to use a proper JWT library)
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.user_id || payload.id || null;
    } catch (error) {
      console.error('Error extracting user ID from token:', error);
      return null;
    }
  }

  /**
   * Removes a CSV file from the visualization
   * @param fileId The ID of the file to remove
   * @param event The click event (to prevent it from triggering the tab selection)
   */
  deleteCsvFile(fileId: string, event: Event): void {
    // Stop the event from propagating (to prevent tab selection)
    // Stop event propagation to prevent tab selectionr
    event.stopPropagation();

    // Find and remove the file
    const index = this.csvFiles.findIndex((file) => file.id === fileId);
    if (index !== -1) {
      this.csvFiles.splice(index, 1);

      // If we deleted the active file, select another one
      if (fileId === this.activeCsvFile && this.csvFiles.length > 0) {
        this.activeCsvFile = this.csvFiles[0].id;
      } else if (this.csvFiles.length === 0) {
        this.activeCsvFile = '';
      }
    }
  }

  // Method for file selection
  onFileSelected(event: Event): void {
    const fileInput = event.target as HTMLInputElement;
    const file = fileInput?.files?.[0];
    fileInput.value = ''; // Reset input so same file can be uploaded again

    if (file) {
      this.fileUploadForm.patchValue({
        fileName: file.name,
        csvFile: file,
      });
    }
  }

  // Basic CSV parser (you might want to use a library for more complex CSVs)
  parseCsvData(csv: string): any[] {
    const lines = csv.split('\n');
    const headers = lines[0].split(',');
    const result: any[] = [];

    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim() === '') continue;

      const obj: any = {};
      const currentLine = lines[i].split(',');

      for (let j = 0; j < headers.length; j++) {
        obj[headers[j].trim()] = currentLine[j]?.trim();
      }

      result.push(obj);
    }

    return result;
  }

  // Generate chart data from CSV
  generateChartDataFromCsv(csvData: any[]): ChartData {
    // Simplified example
    const firstRow = csvData[0];
    if (!firstRow) return { labels: [], datasets: [] };

    const keys = Object.keys(firstRow);
    const labels = keys.slice(1); // Assuming first column is label

    return {
      labels,
      datasets: [
        {
          label: 'CSV Data',
          backgroundColor: 'rgba(75,192,192,0.2)',
          borderColor: 'rgba(75,192,192,1)',
          pointBackgroundColor: 'rgba(75,192,192,1)',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: 'rgba(75,192,192,1)',
          data: csvData.map((row) => parseFloat(row[keys[1]])),
        },
      ],
    };
  }

  predictCsvFile(): void {
    console.log('predictCsvFile method triggered'); // Debug log
    const file = this.fileUploadForm.get('csvFile')?.value;

    if (!file) {
      console.error('No file selected'); // Debug log
      alert('Please select a file first');
      return;
    }

    // Upload file for prediction
    this.predictionService.uploadCsvForPrediction(file).subscribe({
      next: (response) => {
        if (!response) {
          alert('Failed to upload file. Please try again.');
          return;
        }

        // Check if file already exists in pending files to avoid duplication
        const existingPendingFileIndex = this.pendingFiles.findIndex(
          (pf) => pf.id === response.fileId
        );
        if (existingPendingFileIndex === -1) {
          this.pendingFiles.push({
            id: response.fileId,
            name: response.name || file.name,
            timestamp: new Date(response.timestamp) || new Date(),
          });
        }

        // Reset form
        this.fileUploadForm.reset();

        // Start polling for this specific file
        this.pollFileStatus(response.fileId);
        console.log('File upload successful'); // Debug log
        // Removed file download logic
      },
      error: (error) => {
        console.error('Error uploading file:', error);
        alert('Failed to upload file. Please try again.');
      },
    });
  }

  loadFileToVisualization(fileId: string): void {
    // Prevent loading if another file is currently loading
    if (this.isLoadingFile) {
      return;
    }

    // Check if file already exists in visualization tabs
    const existingFileIndex = this.csvFiles.findIndex(
      (file) => file.id === fileId
    );

    if (existingFileIndex !== -1) {
      this.activeCsvFile = fileId;
      this.currentPage = 0;
      this.chartKey = `${fileId}-${Date.now()}`;
      return;
    }

    // Start loading state for new files
    this.isLoadingFile = true;
    this.disableOtherMyFiles = true;
    this.isChartReady = false;

    // Get user ID for API call
    const userId =
      localStorage.getItem('userId') ||
      this.extractUserIdFromToken() ||
      'default-user-id';

    this.predictionService.getFileDetails(userId, fileId).subscribe({
      next: (fileDetails) => {
        try {
          console.log('Received file details:', fileDetails);

          // Transform the data to match expected format
          const transformedData = this.transformFileDetailsData(fileDetails);

          // Create chart data from the transformed data
          const chartData = this.generateChartDataFromFileDetails(fileDetails);

          const newFile: FilesResponseWithChart = {
            id: fileDetails.file_id || fileId,
            name: this.cleanFileName(fileDetails.filename || `File ${fileId}`),
            timestamp: new Date(),
            data: transformedData,
            chartData: chartData,
          };

          this.csvFiles.push(newFile);
          this.activeCsvFile = fileId;
          this.currentPage = 0;
          this.chartKey = `${fileId}-${Date.now()}`;

          // Reset loading state after successful load
          setTimeout(() => {
            this.isLoadingFile = false;
            this.disableOtherMyFiles = false;
            this.isChartReady = true;
            this.cdr.detectChanges();
          }, 800);
        } catch (error) {
          console.error('Error processing file details:', error);
          this.resetLoadingState();
          alert('Failed to process file details. Please try again.');
        }
      },
      error: (error) => {
        console.error('Error loading file details:', error);
        this.resetLoadingState();
        alert('Failed to load file details. Please try again.');
      },
    });
  }

  /**
   * Transform API file details data to match frontend format
   */
  private transformFileDetailsData(fileDetails: any): any[] {
    if (!fileDetails || !fileDetails.data || !Array.isArray(fileDetails.data)) {
      return [];
    }

    return fileDetails.data.map((row: any) => ({
      text: row.text,
      final_prediction: row.final_prediction,
      confidence: Math.round((row.confidence || 0) * 100), // Convert to percentage
      sentiment_scores: [
        { name: 'Negative', value: Math.round((row.Negative || 0) * 100) },
        {
          name: 'Slightly Negative',
          value: Math.round((row['Slightly Negative'] || 0) * 100),
        },
        { name: 'Neutral', value: Math.round((row.neutral || 0) * 100) },
        {
          name: 'Slightly Positive',
          value: Math.round((row['Slightly Positive'] || 0) * 100),
        },
        { name: 'Positive', value: Math.round((row.Positive || 0) * 100) },
      ],
    }));
  }

  // Chart data for single prediction
  get singlePredictionChartData(): ChartData {
    if (!this.lastSinglePrediction) {
      // Return a valid empty chart structure
      return {
        labels: [],
        datasets: [
          {
            data: [],
            backgroundColor: [],
          },
        ],
      };
    }

    // Return cached data if prediction hasn't changed
    if (
      this._cachedChartData &&
      this._lastPredictionTimeStamp === this.lastSinglePrediction.timestamp
    ) {
      return this._cachedChartData;
    }

    // Generate new chart data
    const chartData: ChartData = {
      labels:
        this.lastSinglePrediction?.sentiment_scores?.map((c) => c.name) || [],
      datasets: [
        {
          data:
            this.lastSinglePrediction?.sentiment_scores?.map((c) => c.value) ||
            [],
          backgroundColor: [
            'rgba(25, 135, 84, 0.8)', // Very Positive - green
            'rgba(13, 202, 240, 0.8)', // Slightly Positive - info blue
            'rgba(108, 117, 125, 0.8)', // Neutral - gray
            'rgba(255, 193, 7, 0.8)', // Slightly Negative - amber
            'rgba(220, 53, 69, 0.8)', // Very Negative - red
          ],
          borderWidth: 1,
        },
      ],
    };

    // Cache the data and timestamp
    this._cachedChartData = chartData;
    this._lastPredictionTimeStamp =
      this.lastSinglePrediction.timestamp || new Date();

    return chartData;
  }

  getPaginatedData(
    dataArray: any[] | undefined,
    currentPage: number,
    pageSize: number
  ): any[] {
    // Always use client-side pagination for both tabs
    if (!dataArray || !dataArray.length) return [];
    const start = currentPage * pageSize;
    const end = start + pageSize;
    return dataArray.slice(start, end);
  }

  get totalItems(): number {
    if (this.activeTab === 'bulk') {
      return this.currentCsvFile?.data?.length || 0;
    }

    return this.singlePredictionHistory?.length || 0;
  }

  // Common method to get visible page numbers
  getVisiblePageNumbers(totalItems: number,pageSize: number,currentPage: number): number[] {
    const totalPages = Math.ceil(totalItems / pageSize);
    const pages: number[] = [];

    if (totalPages <= 7) {
      // Show all pages if 7 or fewer
      for (let i = 0; i < totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show first, last, current, and pages around current
      pages.push(0); // First page

      if (currentPage > 2) {
        pages.push(-1); // Ellipsis
      }

      // Pages around current
      const start = Math.max(1, currentPage - 1);
      const end = Math.min(totalPages - 2, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 3) {
        pages.push(-1); // Ellipsis
      }

      if (totalPages > 1) {
        pages.push(totalPages - 1); // Last page
      }
    }

    return pages;
  }

  onPageSizeChange(target: 'bulk' | 'history'): void {
    if (target === 'bulk') {
      this.currentPage = 0; // Reset to first page when changing page size
    } else {
      this.historyCurrentPage = 0; // Reset to first page when changing page size
    }
  }

  // Helper method to get color for category
  getCategoryColor(categoryName: string): string {
    const colorMap: Record<string, string> = {
      Negative: 'rgba(220, 53, 69, 0.8)',
      'Slightly Negative': 'rgba(255, 193, 7, 0.8)',
      Neutral: 'rgba(108, 117, 125, 0.8)',
      'Slightly Positive': 'rgba(13, 202, 240, 0.8)',
      Positive: 'rgba(25, 135, 84, 0.8)',
    };

    return colorMap[categoryName] || 'gray';
  }

  showCategoriesModal(categories: any[]): void {
    console.log('Categories:', categories);
    this.selectedCategories = categories;
    this.showCategoryModal = true;

    console.log('Categories:', categories);
    setTimeout(() => {
      this.showCategoryModal = false;
    }, 3000);
  }

  pollFileStatus(fileId: string): void {
    // Cancel existing subscription for this file if it exists
    if (this.fileStatusSubscriptions.has(fileId)) {
      this.fileStatusSubscriptions.get(fileId)?.unsubscribe();
    }

    // Set up initial polling variable
    let completedOrError = false;

    // Start new polling subscription
    const subscription = interval(3000) // Poll every 3 seconds
      .pipe(takeWhile(() => !completedOrError))
      .subscribe({
        next: () => {
          // Get user ID for getUserData call
          const userId =
            localStorage.getItem('userId') ||
            this.extractUserIdFromToken() ||
            'default-user-id';

          this.predictionService.getUserData(userId).subscribe({
            next: (userData) => {
              // Check if file is still in pending files
              const pendingFile = userData.pendingFiles.find(
                (file) => file.id === fileId
              );

              if (pendingFile) {
                // File is still pending, continue polling
                console.log(`File ${fileId} still pending...`);
                return;
              }

              // Check if file is now in completed files
              const completedFile = userData.completedFiles.find(
                (file) => file.id === fileId
              );

              if (completedFile) {
                // File is now completed
                completedOrError = true;

                // Remove from pending files
                this.pendingFiles = this.pendingFiles.filter(
                  (file) => file.id !== fileId
                );

                // Add to completed files if not already there
                const existingCompleted = this.myFiles.find(
                  (file) => file.id === fileId
                );
                if (!existingCompleted) {
                  this.myFiles.push({
                    id: completedFile.id,
                    name: completedFile.name,
                    timestamp: new Date(completedFile.timestamp),
                    data: [], 
                  });
                  this.filterFiles(); // Update filtered files
                }

                // Clean up the subscription
                if (this.fileStatusSubscriptions.has(fileId)) {
                  this.fileStatusSubscriptions.get(fileId)?.unsubscribe();
                  this.fileStatusSubscriptions.delete(fileId);
                }

                console.log(
                  `File ${fileId} completed and moved to completed files`
                );
              } else {
                // File not found in either pending or completed - assume error
                completedOrError = true;
                this.pendingFiles = this.pendingFiles.filter(
                  (file) => file.id !== fileId
                );

                alert(`Processing of file failed: File not found`);

                // Clean up the subscription
                if (this.fileStatusSubscriptions.has(fileId)) {
                  this.fileStatusSubscriptions.get(fileId)?.unsubscribe();
                  this.fileStatusSubscriptions.delete(fileId);
                }
              }
            },
            error: (error) => {
              console.error(
                'Error checking file status via getUserData:',
                error
              );
              completedOrError = true; // Stop polling on error

              // Clean up the subscription
              if (this.fileStatusSubscriptions.has(fileId)) {
                this.fileStatusSubscriptions.get(fileId)?.unsubscribe();
                this.fileStatusSubscriptions.delete(fileId);
              }
            },
          });
        },
      });

    // Store the subscription
    this.fileStatusSubscriptions.set(fileId, subscription);
  }

  private startPeriodicFileCheck(): void {
    // Check every 30 seconds for any pending files that need polling
    interval(30000).subscribe(() => {
      if (this.pendingFiles.length > 0) {
        // Check if we have active subscriptions for all pending files
        this.pendingFiles.forEach((file) => {
          if (!this.fileStatusSubscriptions.has(file.id)) {
            console.log(`Starting polling for file: ${file.id}`);
            this.pollFileStatus(file.id);
          }
        });
      }
    });
  }

  refreshFilesList(): void {
    this.predictionService.getFiles().subscribe({
      next: (response) => {
        if (!response) {
          console.error('Received null response from getFiles()');
          return;
        }

        // Update pending files - ensure we don't have duplicates
        const pendingFileIds = new Set(
          this.pendingFiles.map((file) => file.id)
        );

        // Only add files that aren't already in our pending list
        if (response.pendingFiles && Array.isArray(response.pendingFiles)) {
          response.pendingFiles.forEach((file) => {
            if (!pendingFileIds.has(file.id)) {
              this.pendingFiles.push({
                id: file.id,
                name: file.name,
                timestamp: new Date(file.timestamp),
              });
            }
          });

          // Also ensure we remove any files that are no longer pending
          const apiPendingFileIds = new Set(
            response.pendingFiles.map((file: any) => file.id)
          );
          this.pendingFiles = this.pendingFiles.filter((file) =>
            apiPendingFileIds.has(file.id)
          );
        }

        // Update completed files
        if (response.completedFiles && Array.isArray(response.completedFiles)) {
          this.myFiles = response.completedFiles.map((file) => ({
            id: file.id,
            name: file.name,
            status: 'completed',
            timestamp: new Date(file.timestamp),
            isDefault: false,
            data: [], // Empty initially, will be loaded when file is selected
            chartData: undefined, // Will be generated when data is loaded
          }));
        }

        // Update filtered files
        this.filterFiles();

        // Trigger change detection to update the UI
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error fetching files:', error);
        this.cdr.detectChanges();
      },
    });
  }

  /**
   * Generate chart data from file details API response
   */
  private generateChartDataFromFileDetails(fileDetails: any): ChartData {
    if (!fileDetails || !fileDetails.data || !Array.isArray(fileDetails.data)) {
      return {
        labels: [],
        datasets: [
          {
            label: 'No Data Available',
            data: [],
            backgroundColor: [],
          },
        ],
      };
    }

    // Count predictions by category
    const sentimentCounts: Record<string, number> = {
      Negative: 0,
      'Slightly Negative': 0,
      Neutral: 0,
      'Slightly Positive': 0,
      Positive: 0,
    };

    // Aggregate sentiment scores
    const sentimentTotals: Record<string, number> = {
      Negative: 0,
      'Slightly Negative': 0,
      Neutral: 0,
      'Slightly Positive': 0,
      Positive: 0,
    };

    fileDetails.data.forEach((row: any) => {
      // Count final predictions
      const prediction = row.final_prediction;
      if (prediction && sentimentCounts.hasOwnProperty(prediction)) {
        sentimentCounts[prediction]++;
      }

      // Sum sentiment scores for average calculation
      sentimentTotals['Negative'] += row.Negative || 0;
      sentimentTotals['Slightly Negative'] += row['Slightly Negative'] || 0;
      sentimentTotals['Neutral'] += row.neutral || 0;
      sentimentTotals['Slightly Positive'] += row['Slightly Positive'] || 0;
      sentimentTotals['Positive'] += row.Positive || 0;
    });

    // Calculate averages (convert from decimal to percentage)
    const dataCount = fileDetails.data.length;
    const averageScores = Object.keys(sentimentTotals).map((key) =>
      Math.round((sentimentTotals[key] / dataCount) * 100)
    );

    return {
      labels: Object.keys(sentimentCounts),
      datasets: [
        {
          label: 'Average Sentiment Distribution',
          data: averageScores,
          backgroundColor: [
            'rgba(220, 53, 69, 0.8)', // Negative - red
            'rgba(255, 193, 7, 0.8)', // Slightly Negative - amber
            'rgba(108, 117, 125, 0.8)', // Neutral - gray
            'rgba(13, 202, 240, 0.8)', // Slightly Positive - info blue
            'rgba(25, 135, 84, 0.8)', // Positive - green
          ],
          borderColor: 'rgba(179,181,198,1)',
          borderWidth: 1,
        },
      ],
    };
  }

  /**
   * Clean filename for display
   */
  public cleanFileName(filename: string): string {
    return filename
      .replace(/_completed\.csv$/, '.csv')
      .replace(/^\d{8}_\d{6}_/, '') // Remove timestamp prefix
      .replace(/\.csv$/, ''); // Remove .csv extension for display
  }

  generateChartDataFromApiResponse(fileDetails: any): ChartData {
    if (!fileDetails || !fileDetails.data) {
      // Return empty chart data when no details are available
      return {
        labels: [],
        datasets: [
          {
            label: 'No Data Available',
            backgroundColor: [],
            borderColor: 'rgba(179,181,198,1)',
            data: [],
          },
        ],
      };
    }

    // Assuming the API returns data with sentiment categories and counts
    const sentimentCounts: Record<string, number> = {
      Positive: 0,
      'Slightly Positive': 0,
      Neutral: 0,
      'Slightly Negative': 0,
      Negative: 0,
    };

    // Count prediction categories
    if (Array.isArray(fileDetails.data)) {
      fileDetails.data.forEach((item: any) => {
        const prediction = item?.Prediction;
        // Check if prediction exists and is a key in sentimentCounts
        if (
          prediction &&
          Object.prototype.hasOwnProperty.call(sentimentCounts, prediction)
        ) {
          sentimentCounts[prediction as keyof typeof sentimentCounts]++;
        }
      });
    }

    return {
      labels: Object.keys(sentimentCounts),
      datasets: [
        {
          label: 'Sentiment Distribution',
          backgroundColor: [
            'rgba(25, 135, 84, 0.8)', // Very Positive - green
            'rgba(13, 202, 240, 0.8)', // Slightly Positive - info blue
            'rgba(108, 117, 125, 0.8)', // Neutral - gray
            'rgba(255, 193, 7, 0.8)', // Slightly Negative - amber
            'rgba(220, 53, 69, 0.8)', // Very Negative - red
          ],
          borderColor: 'rgba(179,181,198,1)',
          data: Object.values(sentimentCounts),
        },
      ],
    };
  }

  ngOnDestroy(): void {
    // Clean up all subscriptions
    this.fileStatusSubscriptions.forEach((sub) => sub.unsubscribe());
    this.fileStatusSubscriptions.clear();
  }

  navigateToTab(tab: string): void {
    this.router.navigate(['/dashboard', tab]);
  }

  navigateToSubscription(): void {
    console.log('Navigating to subscription page...');

    // Use the router to navigate programmatically
    this.router
      .navigate(['/subscription'])
      .then((success) => {
        // Log whether navigation was successful for debugging
        console.log('Navigation success:', success);

        if (!success) {
          // If navigation fails, try an alternative approach
          console.error('Navigation failed, trying window.location');
          window.location.href = '/subscription';
        }
      })
      .catch((err) => {
        console.error('Navigation error:', err);
      });
  }

  get hasBulkAccess(): boolean {
    const hasAccess = this.subscriptionService.hasBulkAccess();
    console.log('Dashboard hasBulkAccess check:', hasAccess);
    return hasAccess;
  }

  switchTab(tab: string): void {
    // Prevent tab switching if currently loading a file
    if (this.isLoadingFile) {
      return;
    }

    // Reset chart state when switching tabs
    this.isChartReady = false;

    // Always allow switching to the tab, even without access
    this.activeTab = tab;

    // Navigate without reloading the component
    this.router.navigate(['/dashboard', tab], {
      skipLocationChange: false,
      replaceUrl: false,
    });

    // Reset chart ready state after navigation
    setTimeout(() => {
      this.isChartReady = true;
      this.cdr.detectChanges();
    }, 300);
  }

  downloadFile(fileId: string): void {
    const userId = localStorage.getItem('userId') || 
                  this.extractUserIdFromToken() || 
                  'default-user-id';

    console.log('Downloading file:', { userId, fileId });

    this.predictionService.downloadFile(userId, fileId).subscribe({
      next: (blob) => {
        // Create download link
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        
        // Clean the filename for download
        const cleanedFileId = this.cleanFileName(fileId);
        link.download = `predictions_${cleanedFileId}.csv`;
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        console.log('File downloaded successfully');
      },
      error: (error) => {
        console.error('Error downloading file:', error);
        
        // Show more detailed error message
        let errorMessage = 'Failed to download file. ';
        if (error.error && error.error.message) {
          errorMessage += error.error.message;
        } else if (error.status === 404) {
          errorMessage += 'File not found on server.';
        } else {
          errorMessage += 'Please try again.';
        }
        
        alert(errorMessage);
      },
    });
  }
}