/*
 * Copyright 2018 ThoughtWorks, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

describe("Dashboard Trigger With Options Material Info Widget", () => {
  const m = require("mithril");

  const TriggerWithOptionsInfo = require('models/dashboard/trigger_with_options_info');
  const MaterialInfoWidget     = require("views/dashboard/trigger_with_options/material_info_widget");
  const TimeFormatter          = require('helpers/time_formatter');

  let $root, root;
  beforeEach(() => {
    [$root, root] = window.createDomElementForTest();
  });

  afterEach(() => {
    window.destroyDomElementForTest();
  });

  let info;
  const searchVM = {
    performSearch:         jasmine.createSpy('performSearch'),
    searchText:            jasmine.createSpy('searchText'),
    searchInProgress:      jasmine.createSpy('searchInProgress'),
    materialSearchResults: jasmine.createSpy('materialSearchResult'),
    isRevisionSelected:    jasmine.createSpy('isRevisionSelected')
  };

  beforeEach(() => {
    searchVM.materialSearchResults.and.returnValue(searchResults);
    info = TriggerWithOptionsInfo.fromJSON(json);
  });

  afterEach(() => {
    m.mount(root, null);
    m.redraw();
  });

  function mount(material) {
    m.mount(root, {
      view() {
        return m(MaterialInfoWidget, {
          material,
          searchVM
        });
      }
    });
    m.redraw(true);
  }

  it("it should render material info when revision is present", () => {
    mount(info.materials[0]);
    const material = json.materials[0];

    expect($root.find('.name-value .meta')).toContainText(material.type);
    expect($root.find('.name-value .meta')).toContainText(material.name);

    expect($root.find('.name-value .destination')).toContainText(material.destination);

    expect($root.find('.name-value .date')).toContainText(TimeFormatter.format(material.revision.date));

    expect($root.find('.name-value .user')).toContainText(material.revision.user);

    expect($root.find('.name-value .comment')).toContainText(material.revision.comment);

    expect($root.find('.name-value .last-run-revision')).toContainText(material.revision.last_run_revision);
  });

  it("it should render material info when revision is not present", () => {
    mount(info.materials[1]);

    const material = json.materials[1];

    expect($root.find('.name-value .meta')).toContainText(material.type);
    expect($root.find('.name-value .meta')).toContainText(material.name);

    expect($root.find('.name-value .destination')).toContainText('not specified');

    expect($root.find('.name-value .date')).toContainText('never ran');

    expect($root.find('.name-value .user')).toContainText('never ran');

    expect($root.find('.name-value .comment')).toContainText('never ran');

    expect($root.find('.name-value .last-run-revision')).toContainText('never ran');
  });

  it("it should render material revision is missing content", () => {
    mount(info.materials[2]);

    const material = json.materials[2];

    expect($root.find('.name-value .meta')).toContainText(material.type);
    expect($root.find('.name-value .meta')).toContainText(material.name);

    expect($root.find('.name-value .destination')).toContainText('not specified');

    expect($root.find('.name-value .date')).toContainText('not specified');

    expect($root.find('.name-value .user')).toContainText('not specified');

    expect($root.find('.name-value .comment')).toContainText('not specified');

    expect($root.find('.name-value .last-run-revision')).toContainText('not specified');
  });

  it('should render searched material revision spinner', () => {
    mount(info.materials[0]);
    expect($root.find('.commits')).toBeInDOM();
  });

  const json = {
    "variables": [],
    "materials": [
      {
        "type":        "Git",
        "name":        "material1",
        "destination": "gocd",
        "fingerprint": "3dcc10e7943de637211a4742342fe456ffbe832577bb377173007499434fd819",
        "revision":    {
          "date":              "2018-02-08T04:32:11Z",
          "user":              "Ganesh S Patil <ganeshpl@thoughtworks.com>",
          "comment":           "Refactor Pipeline Widget (#4311)\n\n* Extract out PipelineHeaderWidget and PipelineOperationsWidget into seperate msx files",
          "last_run_revision": "a2d23c5505ac571d9512bdf08d6287e47dcb52d5"
        }
      },

      {
        "type":        "Git",
        "name":        "material2",
        "fingerprint": "3dcc10e7943de637211a4742342fe456ffbe832577bb377173007499434fd819",
        "revision":    {}
      },
      {
        "type":        "Git",
        "name":        "material2",
        "fingerprint": "3dcc10e7943de637211a4742342fe456ffbe832577bb377173007499434fd819",
        "revision":    {
          'some-junk': '123'
        }
      }
    ]
  };

  const searchResults = [
    {
      "revision": "2a4b782a3a7d2eb13868da75149e716b15f52e5d",
      "user":     "GaneshSPatil <ganeshpl@thoughtworks.com>",
      "date":     "2018-02-12T11:02:48Z",
      "comment":  "implemented feature boo"
    },
    {
      "revision": "7f7653464e14682c7c9ce6a8bf85989a9a52eb35",
      "user":     "GaneshSPatil <ganeshpl@thoughtworks.com>",
      "date":     "2018-02-12T11:01:53Z",
      "comment":  "implemented feature boo"
    },
    {
      "revision": "24d682d8b8a99e8862acac8cae092caeca3a51f3",
      "user":     "GaneshSPatil <ganeshpl@thoughtworks.com>",
      "date":     "2018-02-12T11:01:36Z",
      "comment":  "implemented feature baz"
    },
    {
      "revision": "e5b730abdf7954e7ff45a4c15b2333c550559b35",
      "user":     "GaneshSPatil <ganeshpl@thoughtworks.com>",
      "date":     "2018-02-12T11:01:12Z",
      "comment":  "implemented feature bar"
    },
    {
      "revision": "c30118c0a6e7e6042a50e2db1e191db081e915f0",
      "user":     "GaneshSPatil <ganeshpl@thoughtworks.com>",
      "date":     "2018-02-12T11:01:02Z",
      "comment":  "implemented feature foo"
    }
  ];

});
