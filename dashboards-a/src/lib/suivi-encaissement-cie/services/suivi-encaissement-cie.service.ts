import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ISuiviEncaissementCieFilters } from '@portals/client-reporting';
import { UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import dayjs from 'dayjs';
import { EnvironmentService } from '@portals/base/core/core-component';

@Injectable()
export class SuiviEncaissementCieService {
  suiviEncaissementCieFilters$: BehaviorSubject<ISuiviEncaissementCieFilters | null> =
    new BehaviorSubject<ISuiviEncaissementCieFilters | null>(null);
  filterForToday: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  filterByNextcare: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  today = dayjs().toDate();
  lastYear = dayjs('2022-01-01').toDate();

  public formFilter: UntypedFormGroup = this.fb.group({
    startingDate: [this.lastYear],
    endDate: [this.today],
    souscripteur: [[]],
    cie: [[]],
    numeroLot: [[]],
    status: [[]],
    typeEncaissement: [[]],
    numeroCV: [[]],
  });

  private isExterne: boolean;

  constructor(private fb: UntypedFormBuilder, private env: EnvironmentService) {
    this.isExterne = this.env.isSouscripteurClient;
    if (this.isExterne) {
      this.formFilter.controls['startingDate'].setValue(dayjs().set('month', 0).set('date', 1).toDate());
    }
  }
}
