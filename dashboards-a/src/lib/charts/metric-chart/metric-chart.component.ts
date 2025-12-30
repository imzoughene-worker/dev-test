import { Component, Input, TemplateRef, ViewChild } from '@angular/core';
import { MetricDto } from '@portals/client-reporting';
import { transformNumber } from '@portals/base/core/core-component';
import { KENDO_PROGRESSBAR } from '@progress/kendo-angular-progressbar';
import { NgTemplateOutlet } from '@angular/common';

@Component({
    selector: 'portals-metric-chart',
    templateUrl: './metric-chart.component.html',
    styleUrls: ['./metric-chart.component.scss'],
    imports: [KENDO_PROGRESSBAR, NgTemplateOutlet]
})
export class MetricChartComponent {
  @Input() title = '';
  @Input() data: MetricDto | null = null;
  @Input() isLoading = false;
  @Input() isMoney = false;
  @ViewChild('dataContainer') dataContainer?: TemplateRef<any>;

  get principaleFormatted(): string {
    return this.data?.valuePrincipale ? transformNumber(this.data?.valuePrincipale, this.isMoney) : 'N/A';
  }

  constructor() {}
}
