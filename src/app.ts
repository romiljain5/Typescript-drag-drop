// Project Type
enum ProjectStatus {
  Active,
  Finished,
}

class Project {
  constructor(
    public id: string,
    public title: string,
    public description: string,
    public people: number,
    public status: ProjectStatus
  ) {}
}

type Listener = (items: Project[]) => void;

// Porject State Management - something like useState in react
class PorjectState {
  //listeners will be called whenever something is changed
  private listeners: Listener[] = [];
  private projects: Project[] = [];
  private static instance: PorjectState;

  // singleton, run only one instance of it
  private constructor() {}

  static getInstance() {
    if (this.instance) {
      //if their is already one instance return it
      return this.instance;
    }
    this.instance = new PorjectState();
    return this.instance;
  }
  //end singleton

  addListener(listenerFn: Listener) {
    this.listeners.push(listenerFn);
  }

  addProject(title: string, description: string, numOfPeople: number) {
    const newProject = new Project(
      Math.random().toString(),
      title,
      description,
      numOfPeople,
      ProjectStatus.Active //whenever create new project, assign with active    
    );
    this.projects.push(newProject);
    for (const listenerFn of this.listeners) {
      //pass copy of array using slice
      listenerFn(this.projects.slice());
    }
  }
}

/* global constant we can use this in whole project
we will have only one object in entire application that we will work with, 
because of singleton */
const projectState = PorjectState.getInstance();

//validation
interface Validatable {
  value: string | number;
  required?: boolean; //? as optional
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
}

// validates above objects
function validate(validatableInput: Validatable) {
  let isValid = true;
  if (validatableInput.required) {
    //isValid value will be set to true or false depending on situation
    isValid = isValid && validatableInput.value.toString().trim().length !== 0;
  }

  if (
    validatableInput.minLength != null &&
    typeof validatableInput.value === "string"
  ) {
    isValid =
      isValid && validatableInput.value.length >= validatableInput.minLength;
  }

  if (
    validatableInput.maxLength != null &&
    typeof validatableInput.value === "string"
  ) {
    isValid =
      isValid && validatableInput.value.length <= validatableInput.maxLength;
  }

  //if type is number
  if (
    validatableInput.min != null &&
    typeof validatableInput.value === "number"
  ) {
    isValid = isValid && validatableInput.value >= validatableInput.min;
  }
  if (
    validatableInput.max != null &&
    typeof validatableInput.value === "number"
  ) {
    isValid = isValid && validatableInput.value <= validatableInput.max;
  }

  return isValid;
}

//autobind decorator
function autobind(
  target: any,
  methodName: string,
  descriptor: PropertyDescriptor
) {
  //stores method defined
  const originalMethod = descriptor.value;

  const adjDescriptor: PropertyDescriptor = {
    configurable: true, //set to true, so we can change it later
    get() {
      const boundFn = originalMethod.bind(this);
      return boundFn;
    },
  };
  return adjDescriptor;
}

// ProjectList Class
class ProjectList {
  templateElement: HTMLTemplateElement;
  hostElement: HTMLDivElement; //if not sure assign type HTMLElement
  element: HTMLElement;
  assignedProjects: Project[];

  //literal type in constructor
  constructor(private type: "active" | "finished") {
    this.templateElement = document.getElementById(
      "project-list"
    )! as HTMLTemplateElement; //! - for sure it is their
    this.hostElement = document.getElementById("app")! as HTMLDivElement;
    this.assignedProjects = [];

    // imports HTML content, pass true  for deep cloning of nested elements from html
    const importedNode = document.importNode(
      this.templateElement.content,
      true
    );
    //firstElementChild - gets first child
    this.element = importedNode.firstElementChild as HTMLElement;
    // add css  id to element
    this.element.id = `${this.type}-projects`;

    /* It will get list of projects, will get called only
    when new projects are added */
    projectState.addListener((projects: Project[]) => {
      const relevantProjects = projects.filter(prj => {
        if(this.type === 'active'){
          return prj.status === ProjectStatus.Active;
        }
        return prj.status === ProjectStatus.Finished;
      })
      // override assigned projects with new one
      this.assignedProjects = relevantProjects;
      this.renderProjects();
    });

    this.attach();
    this.renderContent();
  }

  // renders new projects
  private renderProjects() {
    const listEl = document.getElementById(
      `${this.type}-projects-list`
    )! as HTMLUListElement;

    listEl.innerHTML = ''; //get rid of all items and rerender list, to avoid duplicates
    for (let prjItem of this.assignedProjects) {
      const listItem = document.createElement("li");
      listItem.textContent = prjItem.title;
      listEl.appendChild(listItem);
    }
  }

  private renderContent() {
    const listId = `${this.type}-projects-list`;
    this.element.querySelector("ul")!.id = listId;
    this.element.querySelector("h2")!.textContent =
      this.type.toUpperCase() + " PROJECTS";
  }

  private attach() {
    this.hostElement.insertAdjacentElement("beforeend", this.element);
  }
}

//ProjectInput class
class ProjectInput {
  templateElement: HTMLTemplateElement;
  hostElement: HTMLElement; //if not sure assign type HTMLElement
  element: HTMLFormElement;

  //input fields
  titleInputElement: HTMLInputElement;
  descriptionInputElement: HTMLInputElement;
  peopleInputElement: HTMLInputElement;

  constructor() {
    this.templateElement = document.getElementById(
      "project-input"
    )! as HTMLTemplateElement; //! - for sure it is their
    this.hostElement = document.getElementById("app")! as HTMLElement;

    // imports HTML content, pass true  for deep cloning of nested elements from html
    const importedNode = document.importNode(
      this.templateElement.content,
      true
    );

    //firstElementChild - gets first child
    this.element = importedNode.firstElementChild as HTMLFormElement;
    // add css  id to element
    this.element.id = "user-input";
    //select input fields using id
    this.titleInputElement = this.element.querySelector(
      "#title"
    )! as HTMLInputElement;
    this.descriptionInputElement = this.element.querySelector(
      "#description"
    )! as HTMLInputElement;
    this.peopleInputElement = this.element.querySelector(
      "#people"
    )! as HTMLInputElement;

    this.configure();
    this.attach();
  }

  //gets user input from input fields
  private gatherUserInput(): [string, string, number] | void {
    const enteredTitle = this.titleInputElement.value;
    const enteredDescription = this.descriptionInputElement.value;
    const enteredPeople = this.peopleInputElement.value;

    const titleValidatable: Validatable = {
      value: enteredTitle,
      required: true,
    };
    const descriptionValidatable: Validatable = {
      value: enteredDescription,
      required: true,
      minLength: 5,
    };
    const peopleValidatable: Validatable = {
      value: +enteredPeople,
      required: true,
      min: 1,
      max: 5,
    };

    if (
      !validate(titleValidatable) ||
      !validate(descriptionValidatable) ||
      !validate(peopleValidatable)
    ) {
      alert("Invalid input, please try again!");
      return;
    } else {
      // + sign will convert it to number
      return [enteredTitle, enteredDescription, +enteredPeople];
    }
  }

  private clearInput() {
    this.titleInputElement.value = "";
    this.descriptionInputElement.value = "";
    this.peopleInputElement.value = "";
  }

  @autobind
  private submitHandler(event: Event) {
    event.preventDefault();
    // console.log(this.titleInputElement.value);
    const userInput = this.gatherUserInput();
    if (Array.isArray(userInput)) {
      const [title, desc, people] = userInput;
      projectState.addProject(title, desc, people);
      console.log(title, desc, people);
      this.clearInput();
    }
  }

  private configure() {
    /*when form submitted, submitHandler gets triggered
    we use bind(this) so this keyword in submitHandler will refer
    to this same as used in configure method*/
    this.element.addEventListener("submit", this.submitHandler);
  }

  //private becoz we won't be accessing it outside of class only inside
  private attach() {
    //inserts right after begin of open tag - afterbegin, this.element - we want to render this in id='app'
    this.hostElement.insertAdjacentElement("afterbegin", this.element);
  }
}

const prjInput = new ProjectInput();
const activerPrjList = new ProjectList("active");
const finishedPrjList = new ProjectList("finished");