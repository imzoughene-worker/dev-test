import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ISuiviSinistreFilters } from '@portals/client-reporting';
import { UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { EnvironmentService } from '@portals/base/core/core-component';
import dayjs from 'dayjs';

@Injectable()
export class SuiviSinistreService {
  suiviSinistreFilters$: BehaviorSubject<ISuiviSinistreFilters | null> =
    new BehaviorSubject<ISuiviSinistreFilters | null>(null);
  filterByNextcare: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  filterForToday: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  filterByPolice = new BehaviorSubject<boolean>(false);
  today = dayjs().toDate();
  lastYear = dayjs('2022-01-01').toDate();

  public formFilter: UntypedFormGroup = this.fb.group({
    startingDate: [this.lastYear],
    endDate: [this.today],
    souscripteur: [[]],
    numeroLot: [[]],
    police: [[]],
    adherent: [[]],
    numeroDeclaration: [[]],
    etat: [[]],
    etatClient: [[]],
  });

  private isExterne: boolean;

  constructor(private fb: UntypedFormBuilder, private env: EnvironmentService) {
    this.isExterne = this.env.isSouscripteurClient;
    if (this.isExterne) {
      this.formFilter.controls['startingDate'].setValue(dayjs().set('month', 0).set('date', 1).toDate());
    }
  }
}
