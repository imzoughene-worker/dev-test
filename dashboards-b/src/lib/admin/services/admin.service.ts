import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { IAdminFilter } from '@portals/client-reporting';
import { UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import dayjs from 'dayjs';

@Injectable()
export class AdminService {
  adminFilters$: BehaviorSubject<IAdminFilter | null> = new BehaviorSubject<IAdminFilter | null>(null);
  filterByNextcare: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  filterForToday: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  today = dayjs().toDate();
  lastYear = dayjs('2022-01-01').toDate();

  public formFilter: UntypedFormGroup = this.fb.group({
    startingDate: [this.lastYear],
    endDate: [this.today],
    souscripteur: [],
  });

  constructor(private fb: UntypedFormBuilder) {}
}
