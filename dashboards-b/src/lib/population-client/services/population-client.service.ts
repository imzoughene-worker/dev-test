import { BehaviorSubject } from 'rxjs';
import { Injectable } from '@angular/core';
import { IAffiliationFilter } from '@portals/client-reporting';
import { UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import dayjs from 'dayjs';
import { EnvironmentService } from '@portals/base/core/core-component';

@Injectable()
export class PopulationClientService {
  affiliationFilters$: BehaviorSubject<IAffiliationFilter | null> = new BehaviorSubject<IAffiliationFilter | null>(
    null
  );
  today = dayjs().toDate();
  lastYear = dayjs('2022-01-01').toDate();

  public formFilter: UntypedFormGroup = this.fb.group({
    startingDate: [this.lastYear],
    endDate: [this.today],
    souscripteur: [[]],
    police: [[]],
    status: [[]],
    numeroAdhesion: [[]],
    anneeAdhesion: [[]],
    trimestreAdhesion: [[]],
  });

  public isExterne: boolean;

  constructor(private fb: UntypedFormBuilder, private env: EnvironmentService) {
    this.isExterne = this.env.isSouscripteurClient;
    if (this.isExterne) {
      this.formFilter.controls['startingDate'].setValue(dayjs().set('month', 0).set('date', 1).toDate());
    }
  }
}
