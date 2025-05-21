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
import { filter, interval, Subscription, takeWhile } from 'rxjs';
import { ActivatedRoute, NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';

interface CsvFile {
  id: string;
  name: string;
  data: any[];
  chartData?: ChartData;
  isDefault?: boolean;
  status: string;
  timestamp: Date; 
}

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
    AlertComponent
  ],
})

export class DashboardComponent implements OnInit {
  private _cachedChartData: ChartData | null = null;
  private _lastPredictionTimeStamp: Date | null = null;
  private selectedHistoryItem: any = null;
  private statusCheckSubscription: Subscription | null = null;
  private fileStatusSubscriptions = new Map<string, Subscription>();

  public activeTab = 'single';
  public activeCsvFile = ''; // Track active CSV file
  public mainChart: IChartProps = { type: 'line' };
  public mainChartRef: WritableSignal<any> = signal(undefined);
  public chart: Array<IChartProps> = [];
  public fileSearchQuery: string = '';
  public filteredFiles: CsvFile[] = [];
  public pageSize: number = 10;
  public currentPage: number = 0;
  public Math = Math; // Make Math available to the template
  public isProcessingSinglePrediction: boolean = false;
  public historyPageSize: number = 5;
  public historyCurrentPage: number = 0;
  public selectedCategories: any[] = [];
  public showCategoryModal: boolean = false;

  // Track the last prediction for chart display
  public lastSinglePrediction: {
    text: string;
    result: string; // The top prediction category
    confidence: number; // Confidence of top category
    categories: { name: string; value: number }[]; // All 5 categories with values
    timestamp: Date;
  } | null = null;

  public singlePredictionHistory: {
    text: string;
    result: string;
    confidence: number;
    categories: { name: string; value: number }[];
    timestamp: Date;
  }[] = [];

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
  public pendingFiles: { id: string; name: string; timestamp: Date }[] = [];
  public myFiles: CsvFile[] = []; // This will store user's completed files

  constructor(
  private http: HttpClient,
  private predictionService: PredictionService,
  private subscriptionService: SubscriptionService, // Add this
  private cdr: ChangeDetectorRef,
  private route: ActivatedRoute,
  private router: Router
  ) {}

  get totalPages(): number {
    return this.currentCsvFile
      ? Math.ceil(this.currentCsvFile.data.length / this.pageSize)
      : 0;
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

  public csvFiles: CsvFile[] = [
    {
      id: 'csv1',
      name: 'Sample Data 1',
      isDefault: false,
      data: [
        { class: 'A', value1: 85, value2: 92 },
        { class: 'B', value1: 72, value2: 68 },
        { class: 'C', value1: 90, value2: 95 },
        { class: 'A', value1: 85, value2: 92 },
        { class: 'B', value1: 72, value2: 68 },
        { class: 'C', value1: 90, value2: 95 },
        { class: 'A', value1: 85, value2: 92 },
        { class: 'B', value1: 72, value2: 68 },
        { class: 'C', value1: 90, value2: 95 },
        { class: 'A', value1: 85, value2: 92 },
        { class: 'B', value1: 72, value2: 68 },
        { class: 'C', value1: 90, value2: 95 },
        { class: 'A', value1: 85, value2: 92 },
        { class: 'B', value1: 72, value2: 68 },
        { class: 'C', value1: 90, value2: 95 },
        { class: 'A', value1: 85, value2: 92 },
        { class: 'B', value1: 72, value2: 68 },
        { class: 'C', value1: 90, value2: 95 },
      ],
      status: 'completed',
      timestamp: new Date(),
      chartData: {
        labels: ['A', 'B', 'C'],
        datasets: [
          {
            label: 'Sample Dataset 1',
            backgroundColor: 'rgba(179,181,198,0.2)',
            borderColor: 'rgba(179,181,198,1)',
            pointBackgroundColor: 'rgba(179,181,198,1)',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: 'rgba(179,181,198,1)',
            data: [85, 72, 90],
          },
        ],
      },
    },
    {
      id: 'csv2',
      name: 'Sample Data 2',
      isDefault: false, // Added this property
      data: [
        { class: 'X', value1: 65, value2: 79 },
        { class: 'Y', value1: 88, value2: 91 },
        { class: 'Z', value1: 76, value2: 82 },
      ],
      status: 'completed',
      timestamp: new Date(),
      chartData: {
        labels: ['X', 'Y', 'Z'],
        datasets: [
          {
            label: 'Sample Dataset 2',
            backgroundColor: 'rgba(255,99,132,0.2)',
            borderColor: 'rgba(255,99,132,1)',
            pointBackgroundColor: 'rgba(255,99,132,1)',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: 'rgba(255,99,132,1)',
            data: [65, 88, 76],
          },
        ],
      },
    },
  ];

  chartRadarData: ChartData = {
    labels: [
      'Eating',
      'Drinking',
      'Sleeping',
      'Designing',
      'Coding',
      'Cycling',
      'Running',
    ],
    datasets: [
      {
        label: '2020',
        backgroundColor: 'rgba(179,181,198,0.2)',
        borderColor: 'rgba(179,181,198,1)',
        pointBackgroundColor: 'rgba(179,181,198,1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(179,181,198,1)',
        data: [65, 59, 90, 81, 56, 55, 40],
      },
    ],
  };

  ngOnInit(): void {
    // 1. Get the initial activeTab from route data
    this.route.data.subscribe(data => {
      if (data['activeTab']) {
        this.activeTab = data['activeTab'];
        console.log('Active tab from route data:', this.activeTab);
      }
    });
    
    // 2. Update activeTab on URL changes without full reload
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      const url = this.router.url;
      
      if (url.includes('/dashboard/bulk')) {
        this.activeTab = 'bulk';
      } else if (url.includes('/dashboard/single')) {
        this.activeTab = 'single';
      }
      
      // Force change detection to update UI without full reload
      this.cdr.detectChanges();
    });

    this.predictionService.getUserData().subscribe({
      next: (userData) => {
        this.singlePredictionHistory = userData.predictionHistory;
        this.pendingFiles = userData.pendingFiles;
        this.myFiles = userData.completedFiles;
        this.filteredFiles = this.myFiles;

        // Set active CSV file if any exist
        if (this.csvFiles.length > 0) {
          this.activeCsvFile = this.csvFiles[0].id;
        }

        // Set initial data for single prediction display
        if (this.singlePredictionHistory.length > 0) {
          this.lastSinglePrediction = { ...this.singlePredictionHistory[0] };
          this.selectedHistoryItem = this.singlePredictionHistory[0];
        }
      },
      error: (error) => {
        console.error('Error loading user data:', error);
        // Fallback to sample data if API fails
        this.csvFiles = SAMPLE_CSV_FILES;
        this.singlePredictionHistory = SAMPLE_PREDICTION_HISTORY;
        this.pendingFiles = SAMPLE_PENDING_FILES;
        this.myFiles = SAMPLE_MY_FILES;
        this.filteredFiles = this.myFiles;

        if (this.singlePredictionHistory.length > 0) {
          this.lastSinglePrediction = { ...this.singlePredictionHistory[0] };
          this.selectedHistoryItem = this.singlePredictionHistory[0];
        }
      },
    });
  }

  showHistoryItemChart(prediction: any): void {
    this.selectedHistoryItem = prediction;

    // Update the current chart with this prediction's data
    this.lastSinglePrediction = {
      text: prediction.text,
      result: prediction.result,
      confidence: prediction.confidence,
      categories: prediction.categories,
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
    this.activeCsvFile = fileId;
    this.currentPage = 0;
  }

  get currentCsvFile(): CsvFile | undefined {
    return this.csvFiles.find((file) => file.id === this.activeCsvFile);
  }

  predictSingleText(): void {
    const textValue = this.singlePredictionForm.get('textInput')?.value;
    if (!textValue) return;
    this.isProcessingSinglePrediction = true;

    this.predictionService.predictText(textValue).subscribe({
      next: (result) => {
        const categories = Object.entries(result.sentiment_scores).map(
          ([name, value]) => ({
            name: name === 'neutral' ? 'Neutral' : name,
            value: Number(((value as number) * 100).toFixed(2)),
          })
        );

        const prediction = {
          text: textValue,
          result: result.final_prediction,
          confidence: Number(
            (result.sentiment_scores[result.final_prediction] * 100).toFixed(2)
          ),
          categories: categories,
          timestamp: new Date(),
          rawResponse: result,
        };

        this.predictionService.savePredictionToHistory(prediction);

        this.predictionService.getUserData().subscribe((userData) => {
          this.singlePredictionHistory = userData.predictionHistory;
          this.lastSinglePrediction = { ...prediction };
          this.selectedHistoryItem = this.singlePredictionHistory[0];
          this.historyCurrentPage = 0;
          this._cachedChartData = null;
          this.singlePredictionForm.reset();
          this.isProcessingSinglePrediction = false;
        });
      },
      error: (error) => {
        console.error('[DEBUG] Error in predictSingleText:', error);
        this.isProcessingSinglePrediction = false;
        alert('Failed to process prediction. Please try again.');
      },
    });
  }

  getHeaders(dataRow: any): string[] {
    if (!dataRow) return [];
    return Object.keys(dataRow);
  }

  /**
   * Removes a CSV file from the visualization
   * @param fileId The ID of the file to remove
   * @param event The click event (to prevent it from triggering the tab selection)
   */
  deleteCsvFile(fileId: string, event: Event): void {
    // Stop the event from propagating (to prevent tab selection)
    // Stop event propagation to prevent tab selection
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

  predictCsvFile(): void {
    const file = this.fileUploadForm.get('csvFile')?.value;

    if (!file) {
      alert('Please select a file first');
      return;
    }

    // Upload file for prediction
    this.predictionService.uploadCsvForPrediction(file).subscribe({
      next: (response) => {
        if (!response) {
          // Handle null response
          alert('Failed to upload file. Please try again.');
          return;
        }

        // Check if file already exists in pending files to avoid duplication
        const existingPendingFileIndex = this.pendingFiles.findIndex(
          (pf) => pf.id === response.fileId
        );
        if (existingPendingFileIndex === -1) {
          // Only add to pending files if it's not already there
          this.pendingFiles.push({
            id: response.fileId,
            name: response.name || file.name,
            timestamp: new Date(response.timestamp) || new Date(),
          });
        }

        // Reset form
        this.fileUploadForm.reset();

        // Start polling for status updates
        this.pollFileStatus(response.fileId);
      },
      error: (error) => {
        console.error('Error uploading file:', error);
        alert('Failed to upload file. Please try again.');
      },
    });
  }

  loadFileToVisualization(fileId: string): void {
    // Check if file already exists in visualization tabs
    const existingFileIndex = this.csvFiles.findIndex(
      (file) => file.id === fileId
    );

    if (existingFileIndex !== -1) {
      // File already exists in tabs, just activate it
      this.activeCsvFile = fileId;
      return;
    }

    // Otherwise, fetch file details from API
    this.predictionService.getFileDetails(fileId).subscribe({
      next: (fileDetails) => {
        // Create chart data from the file details
        const chartData = this.generateChartDataFromApiResponse(fileDetails);

        // Add to visualization tabs
        const newFile: CsvFile = {
          id: fileId,
          name: fileDetails.name,
          status: 'completed',
          timestamp: new Date(fileDetails.timestamp),
          isDefault: false,
          data: fileDetails.data || [],
          chartData: chartData,
        };

        this.csvFiles.push(newFile);
        this.activeCsvFile = fileId;
      },
      error: (error) => {
        console.error('Error loading file details:', error);
        alert('Failed to load file details. Please try again.');
      },
    });
  }

  // Chart data for single prediction
  get singlePredictionChartData(): ChartData {
    if (!this.lastSinglePrediction) {
      // Return a valid empty chart structure 
      return { 
        labels: [], 
        datasets: [{
          data: [],
          backgroundColor: []
        }]
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
      labels: this.lastSinglePrediction.categories.map((c) => c.name),
      datasets: [
        {
          data: this.lastSinglePrediction.categories.map((c) => c.value),
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
    this._lastPredictionTimeStamp = this.lastSinglePrediction.timestamp;

    return chartData;
  }

  getPaginatedData(
    dataArray: any[],
    currentPage: number,
    pageSize: number
  ): any[] {
    if (!dataArray || !dataArray.length) return [];
    const start = currentPage * pageSize;
    const end = start + pageSize;
    return dataArray.slice(start, end);
  }

  // Common method to get visible page numbers
  getVisiblePageNumbers(
    totalItems: number,
    pageSize: number,
    currentPage: number
  ): number[] {
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

  // Common method to change page
  changePage(page: number, target: 'bulk' | 'history'): void {
    if (target === 'bulk') {
      const totalPages = this.currentCsvFile
        ? Math.ceil(this.currentCsvFile.data.length / this.pageSize)
        : 0;

      if (page >= 0 && page < totalPages) {
        this.currentPage = page;
      }
    } else {
      const totalPages = Math.ceil(
        this.singlePredictionHistory.length / this.historyPageSize
      );

      if (page >= 0 && page < totalPages) {
        this.historyCurrentPage = page;
      }
    }
  }

  // Common method to handle page size changes
  onPageSizeChange(target: 'bulk' | 'history'): void {
    if (target === 'bulk') {
      this.currentPage = 0;
    } else {
      this.historyCurrentPage = 0;
    }
  }

  formatCategoriesForTooltip(categories: any[]): string {
    if (!categories || !Array.isArray(categories)) return 'No categories';

    return categories.map((cat) => `${cat.name}: ${cat.value}%`).join('\n');
  }

  // Helper method to get color for category
  getCategoryColor(categoryName: string): string {
    const colorMap: Record<string, string> = {
      'Very Negative': 'rgba(220, 53, 69, 0.8)',
      'Slightly Negative': 'rgba(255, 193, 7, 0.8)',
      Neutral: 'rgba(108, 117, 125, 0.8)',
      'Slightly Positive': 'rgba(13, 202, 240, 0.8)',
      'Very Positive': 'rgba(25, 135, 84, 0.8)',
    };

    return colorMap[categoryName] || 'gray';
  }

  showCategoriesModal(categories: any[]): void {
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
    const subscription = interval(2000)
      .pipe(takeWhile(() => !completedOrError))
      .subscribe({
        next: () => {
          this.predictionService.checkFileStatus(fileId).subscribe({
            next: (status) => {
              if (status.status === 'completed') {
                // File is now completed
                completedOrError = true;

                // Remove from pending files
                this.pendingFiles = this.pendingFiles.filter(
                  (file) => file.id !== fileId
                );

                // Refresh the files list to get the new completed file
                this.refreshFilesList();

                // Clean up the subscription
                if (this.fileStatusSubscriptions.has(fileId)) {
                  this.fileStatusSubscriptions.get(fileId)?.unsubscribe();
                  this.fileStatusSubscriptions.delete(fileId);
                }
              } else if (status.status === 'error') {
                // Handle error state
                completedOrError = true;
                this.pendingFiles = this.pendingFiles.filter(
                  (file) => file.id !== fileId
                );

                // Use safe access for the message property since it might not exist
                alert(
                  `Processing of file failed: ${
                    (status as any).message || 'Unknown error'
                  }`
                );

                // Clean up the subscription
                if (this.fileStatusSubscriptions.has(fileId)) {
                  this.fileStatusSubscriptions.get(fileId)?.unsubscribe();
                  this.fileStatusSubscriptions.delete(fileId);
                }
              }
              // For 'pending' status, we just keep polling
            },
            error: (error) => {
              console.error('Error checking file status:', error);
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

  // Also fix the generateChartDataFromApiResponse method to handle potential errors
  generateChartDataFromApiResponse(fileDetails: any): ChartData {
    if (!fileDetails || !fileDetails.data) {
      // Return empty chart data when no details are available
      return {
        labels: [],
        datasets: [{
          label: 'No Data Available',
          backgroundColor: [],
          borderColor: 'rgba(179,181,198,1)',
          data: []
        }]
      };
    }

    // Assuming the API returns data with sentiment categories and counts
    const sentimentCounts: Record<string, number> = {
      'Very Positive': 0,
      'Slightly Positive': 0,
      Neutral: 0,
      'Slightly Negative': 0,
      'Very Negative': 0,
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

  // Add this method
  navigateToSubscription(): void {
    console.log('Navigating to subscription page...');
    
    // Use the router to navigate programmatically
    this.router.navigate(['/subscription']).then(success => {
      // Log whether navigation was successful for debugging
      console.log('Navigation success:', success);
      
      if (!success) {
        // If navigation fails, try an alternative approach
        console.error('Navigation failed, trying window.location');
        window.location.href = '/subscription';
      }
    }).catch(err => {
      console.error('Navigation error:', err);
    });
  }
  
  get hasBulkAccess(): boolean {
    return this.subscriptionService.hasBulkAccess();
  }

  switchTab(tab: string): void {
    // Always allow switching to the tab, even without access
    this.activeTab = tab;
    
    // Navigate without reloading the component
    this.router.navigate(['/dashboard', tab], { 
      skipLocationChange: false,
      replaceUrl: false
    });
  }
}