import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { IAuditFilter } from '@portals/client-reporting';
import { UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import dayjs from 'dayjs';
import { EnvironmentService } from '@portals/base/core/core-component';

@Injectable()
export class AuditService {
  auditFilters$: BehaviorSubject<IAuditFilter | null> = new BehaviorSubject<IAuditFilter | null>(null);
  filterByNextcare: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  filterForToday: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  today = dayjs().toDate();
  lastYear = dayjs('2022-01-01').toDate();

  public formFilter: UntypedFormGroup = this.fb.group({
    startingDate: [this.lastYear],
    endDate: [this.today],
    souscripteur: [],
  });

  constructor(private fb: UntypedFormBuilder, private env: EnvironmentService) {
    if (this.env.isSouscripteurClient) {
      this.formFilter.controls['startingDate'].setValue(dayjs().set('month', 0).set('date', 1).toDate());
    }
  }
}
