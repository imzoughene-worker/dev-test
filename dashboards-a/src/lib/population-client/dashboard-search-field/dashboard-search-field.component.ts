import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { KENDO_MULTISELECT } from '@progress/kendo-angular-dropdowns';
import { SouscripteurActiveMultiselectComponent } from '@portals/base/shared/shared-component';
import { DashboardFields, IFilterField } from './../../dashboard-model';

@Component({
  selector: 'portals-dashboard-search-field',
  templateUrl: './dashboard-search-field.component.html',
  styleUrls: ['./dashboard-search-field.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [KENDO_MULTISELECT, ReactiveFormsModule, SouscripteurActiveMultiselectComponent],
})
export class DashboardSearchFieldComponent {
  @Input() field: IFilterField | null = null;
  protected readonly dashboardFields = DashboardFields;
}
