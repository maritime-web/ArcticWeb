function RiskAssessmentLocation(parameters) {
    this.routeId = parameters.routeId;
    this.id = parameters.id;
    this.name = parameters.name;
    this.lat = parameters.lat;
    this.lon = parameters.lon;
}

function RiskAssessment(parameters) {
    this.id = parameters.id;
    this.time = parameters.time;
    this.location = parameters.assessmentLocation;
    this.scores = parameters.scores;
    this.index = parameters.scores.reduce(function (prev, cur) {
        return prev + cur.index;
    }, 0);
}

function Score(parameters) {
    this.riskFactor = parameters.riskFactor;
    this.scoreOption = parameters.scoreOption;
    this.index = parameters.index;
    this.factorName = parameters.riskFactor.name;
    this.name = parameters.scoreOption ? parameters.scoreOption.name : "-";
}

function ScoreOption(parameters) {
    this.name = parameters.name;
    this.index = parameters.index;
}

function ScoreInterval(parameters) {
    this.minIndex = parameters.minIndex;
    this.maxIndex = parameters.maxIndex;
}

function RiskFactor(parameters) {
    this.vesselId = parameters.vesselId;
    this.id = parameters.id;
    this.name = parameters.name;
    this.scoreOptions = parameters.scoreOptions;
    this.scoreInterval = parameters.scoreInterval;

    if (parameters.scoreOptions && parameters.scoreInterval) {
        throw new Error("A risk factor can't have both score options and score interval");
    }
    if (!parameters.scoreOptions && !parameters.scoreInterval) {
        throw new Error("A risk factor must have either score options or a score interval");
    }
}
