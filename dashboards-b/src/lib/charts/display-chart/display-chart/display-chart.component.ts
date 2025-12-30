import { Component, Input, TemplateRef, ViewChild } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { KENDO_PROGRESSBAR } from '@progress/kendo-angular-progressbar';

@Component({
  selector: 'portals-display-chart',
  templateUrl: './display-chart.component.html',
  styleUrls: ['./display-chart.component.scss'],
  providers: [],
  imports: [NgTemplateOutlet, KENDO_PROGRESSBAR],
})
export class DisplayChartComponent {
  @Input() title = '';
  @Input() data: string[] | null = null;
  @Input() isLoading = true;
  @ViewChild('dataContainer') dataContainer: TemplateRef<any> | undefined;

  constructor() {}
}
