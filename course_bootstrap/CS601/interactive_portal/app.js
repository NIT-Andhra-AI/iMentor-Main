// DSP / Engineering Interactive Learning Engine
const lecturesData = [{"module":"Unit 1","num":1,"title":"Introduction to Machine Learning","subtopics":"Supervised, unsupervised, reinforcement","bloom":"L2_UNDERSTAND","prereq":"None","is_lab":false},{"module":"Unit 1","num":2,"title":"Mathematical Foundations","subtopics":"Linear algebra, probability, calculus basics","bloom":"L2_UNDERSTAND","prereq":"1","is_lab":false},{"module":"Unit 1","num":3,"title":"Data Preprocessing","subtopics":"Imputation, scaling, one-hot encoding","bloom":"L2_UNDERSTAND","prereq":"2","is_lab":false},{"module":"Unit 1","num":4,"title":"Linear Regression","subtopics":"Hypothesis, cost function, OLS method","bloom":"L2_UNDERSTAND","prereq":"3","is_lab":false},{"module":"Unit 1","num":5,"title":"Gradient Descent","subtopics":"Batch, stochastic, mini-batch, learning rate","bloom":"L3_APPLY","prereq":"4","is_lab":false},{"module":"Unit 1","num":6,"title":"Polynomial Regression","subtopics":"Underfitting, overfitting, bias-variance tradeoff","bloom":"L3_APPLY","prereq":"5","is_lab":false},{"module":"Unit 1","num":7,"title":"Regularization Techniques","subtopics":"Ridge (L2), Lasso (L1), Elastic Net","bloom":"L3_APPLY","prereq":"6","is_lab":false},{"module":"Unit 1","num":8,"title":"Logistic Regression","subtopics":"Sigmoid function, cross-entropy loss","bloom":"L3_APPLY","prereq":"7","is_lab":false},{"module":"Unit 1","num":9,"title":"Classification Metrics","subtopics":"Confusion matrix, precision, recall, F1-score","bloom":"L3_APPLY","prereq":"8","is_lab":false},{"module":"Unit 2","num":10,"title":"K-Nearest Neighbors (KNN)","subtopics":"Distance metrics, K selection, curse of dimensionality","bloom":"L3_APPLY","prereq":"9","is_lab":false},{"module":"Unit 2","num":11,"title":"Naive Bayes Classifier","subtopics":"Bayes theorem, conditional independence","bloom":"L3_APPLY","prereq":"10","is_lab":false},{"module":"Unit 2","num":12,"title":"Decision Trees","subtopics":"Entropy, Information Gain, Gini Index","bloom":"L3_APPLY","prereq":"11","is_lab":false},{"module":"Unit 2","num":13,"title":"Ensemble Learning Intro","subtopics":"Bagging, Boosting, Stacking","bloom":"L3_APPLY","prereq":"12","is_lab":false},{"module":"Unit 2","num":14,"title":"Random Forests","subtopics":"Feature randomness, out-of-bag error","bloom":"L4_ANALYZE","prereq":"13","is_lab":false},{"module":"Unit 2","num":15,"title":"Boosting Algorithms","subtopics":"AdaBoost, Gradient Boosting, XGBoost","bloom":"L4_ANALYZE","prereq":"14","is_lab":false},{"module":"Unit 2","num":16,"title":"Support Vector Machines (Linear)","subtopics":"Margin, support vectors, hard/soft margin","bloom":"L4_ANALYZE","prereq":"15","is_lab":false},{"module":"Unit 2","num":17,"title":"SVM (Non-Linear \u0026 Kernels)","subtopics":"Kernel trick, RBF, polynomial kernels","bloom":"L4_ANALYZE","prereq":"16","is_lab":false},{"module":"Unit 2","num":18,"title":"Unsupervised Learning Intro","subtopics":"Clustering vs Dimensionality reduction","bloom":"L4_ANALYZE","prereq":"17","is_lab":false},{"module":"Unit 3","num":19,"title":"K-Means Clustering","subtopics":"Algorithm, convergence, initialization (K-Means++)","bloom":"L4_ANALYZE","prereq":"18","is_lab":false},{"module":"Unit 3","num":20,"title":"Hierarchical Clustering","subtopics":"Agglomerative, dendrograms, linkage criteria","bloom":"L4_ANALYZE","prereq":"19","is_lab":false},{"module":"Unit 3","num":21,"title":"Density-Based Clustering","subtopics":"DBSCAN, epsilon, min-points, noise handling","bloom":"L4_ANALYZE","prereq":"20","is_lab":false},{"module":"Unit 3","num":22,"title":"Dimensionality Reduction","subtopics":"PCA, eigenvalues, variance ratio","bloom":"L4_ANALYZE","prereq":"21","is_lab":false},{"module":"Unit 3","num":23,"title":"Advanced Dimensionality Reduction","subtopics":"t-SNE, UMAP, visualization","bloom":"L5_EVALUATE","prereq":"22","is_lab":false},{"module":"Unit 3","num":24,"title":"Association Rule Learning","subtopics":"Apriori algorithm, support, confidence, lift","bloom":"L5_EVALUATE","prereq":"23","is_lab":false},{"module":"Unit 3","num":25,"title":"Artificial Neural Networks (ANN)","subtopics":"Perceptron, activation functions","bloom":"L5_EVALUATE","prereq":"24","is_lab":false},{"module":"Unit 3","num":26,"title":"Multilayer Perceptron","subtopics":"Hidden layers, universal approximation theorem","bloom":"L5_EVALUATE","prereq":"25","is_lab":false},{"module":"Unit 3","num":27,"title":"Backpropagation Algorithm","subtopics":"Chain rule, weight updates, vanishing gradient","bloom":"L5_EVALUATE","prereq":"26","is_lab":false},{"module":"Unit 4","num":28,"title":"Model Evaluation \u0026 Selection","subtopics":"K-fold cross-validation, learning curves","bloom":"L5_EVALUATE","prereq":"27","is_lab":false},{"module":"Unit 4","num":29,"title":"Hyperparameter Tuning","subtopics":"Grid search, Random search, Bayesian optimization","bloom":"L5_EVALUATE","prereq":"28","is_lab":false},{"module":"Unit 4","num":30,"title":"Handling Imbalanced Data","subtopics":"SMOTE, class weights, undersampling","bloom":"L5_EVALUATE","prereq":"29","is_lab":false},{"module":"Unit 4","num":31,"title":"Time Series Analysis","subtopics":"Stationarity, autocorrelation, ARIMA","bloom":"L5_EVALUATE","prereq":"30","is_lab":false},{"module":"Unit 4","num":32,"title":"Recommender Systems","subtopics":"Collaborative filtering, content-based","bloom":"L5_EVALUATE","prereq":"31","is_lab":false},{"module":"Unit 4","num":33,"title":"Anomaly Detection","subtopics":"Gaussian distribution, Isolation forest","bloom":"L6_CREATE","prereq":"32","is_lab":false},{"module":"Unit 4","num":34,"title":"Reinforcement Learning Basics","subtopics":"Markov Decision Process, Q-learning","bloom":"L6_CREATE","prereq":"33","is_lab":false},{"module":"Unit 4","num":35,"title":"ML System Design","subtopics":"Data pipelines, feature engineering, MLOps","bloom":"L6_CREATE","prereq":"34","is_lab":false},{"module":"Unit 4","num":36,"title":"Ethics in ML","subtopics":"Bias, fairness, explainability, data privacy","bloom":"L6_CREATE","prereq":"35","is_lab":false}];
let currentLecIndex = 0;
let isAnimating = false;
let animFrameId = null;
let timeStep = 0;

document.addEventListener('DOMContentLoaded', () => {
    loadLecture(1);
    initCanvas();
    if (window.renderMathInElement) {
        renderMathInElement(document.body);
    }
});

function loadLecture(num) {
    const idx = lecturesData.findIndex(l => l.num === num);
    if (idx === -1) return;
    currentLecIndex = idx;
    const lec = lecturesData[idx];

    // Update active class in sidebar
    document.querySelectorAll('.lecture-item').forEach(item => {
        item.classList.toggle('active', parseInt(item.getAttribute('data-lecture')) === num);
    });

    // Update header & badges
    document.getElementById('currentLecBadge').innerText = 'L' + lec.num + ': ' + lec.title;
    document.getElementById('bloomBadge').innerText = lec.bloom || 'L3_APPLY';
    document.getElementById('lectureHeaderTitle').innerText = 'Lecture ' + lec.num + ': ' + lec.title;
    document.getElementById('lectureSubtopics').innerHTML = '<strong>Module:</strong> ' + lec.module + ' &bull; <strong>Topics:</strong> ' + lec.subtopics;

    // Reset Quiz
    document.getElementById('checkpointFeedback').style.display = 'none';
    
    // Update Math box
    const mathBox = document.getElementById('lectureMathFormula');
    mathBox.innerHTML = '$$ H(z) = \\frac{\\sum_{k=0}^{M} b_k z^{-k}}{1 + \\sum_{k=1}^{N} a_k z^{-k}} \\iff y[n] = \\sum_{k=0}^{M} b_k x[n-k] - \\sum_{k=1}^{N} a_k y[n-k] $$';
    
    if (window.renderMathInElement) {
        renderMathInElement(mathBox);
    }

    drawSimulation();
}

function nextLecture() {
    if (currentLecIndex < lecturesData.length - 1) {
        loadLecture(lecturesData[currentLecIndex + 1].num);
    }
}

function prevLecture() {
    if (currentLecIndex > 0) {
        loadLecture(lecturesData[currentLecIndex - 1].num);
    }
}

// Interactive Simulation Engine
const canvas = document.getElementById('interactiveCanvas');
const ctx = canvas.getContext('2d');

function initCanvas() {
    drawSimulation();
}

function updateSimulation() {
    const alpha = parseFloat(document.getElementById('sliderAlpha').value);
    const omega = parseFloat(document.getElementById('sliderOmega').value);
    document.getElementById('paramValAlpha').innerText = alpha.toFixed(2);
    document.getElementById('paramValOmega').innerText = omega.toFixed(2);
    drawSimulation();
}

function drawSimulation() {
    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    const alpha = parseFloat(document.getElementById('sliderAlpha').value);
    const omega = parseFloat(document.getElementById('sliderOmega').value);

    // Draw Grid
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 40) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
    }
    for (let y = 0; y < height; y += 40) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
    }

    // Center Axes
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, height / 2); ctx.lineTo(width, height / 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(width / 3, 0); ctx.lineTo(width / 3, height); ctx.stroke();

    // Plot 1: Dynamic Time Waveform (Left / Middle)
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let i = 0; i < 40; i++) {
        const x = (width / 3) + i * 14;
        const decay = Math.pow(Math.abs(alpha), i * 0.1);
        const yVal = (height / 2) - Math.sin(i * omega * 0.2 + timeStep) * 90 * decay;
        if (i === 0) ctx.moveTo(x, yVal);
        else ctx.lineTo(x, yVal);
        
        // Draw stem markers
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(x, yVal, 3.5, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.stroke();

    // Plot 2: Z-Plane Unit Circle / Pole-Zero Map (Left Box)
    const centerX = 120;
    const centerY = height / 2;
    const radius = 70;

    ctx.strokeStyle = '#64748b';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw Pole
    const poleX = centerX + alpha * radius * Math.cos(timeStep * 0.5);
    const poleY = centerY - alpha * radius * Math.sin(timeStep * 0.5);

    ctx.fillStyle = alpha <= 1.0 ? '#10b981' : '#f43f5e';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('x', poleX - 5, poleY + 5);

    // Legend / Metrics
    ctx.fillStyle = '#f8fafc';
    ctx.font = '13px sans-serif';
    ctx.fillText('Pole Magnitude |p|: ' + alpha.toFixed(2), 20, 30);
    ctx.fillText(alpha < 1.0 ? 'System: Stable (BIBO check)' : 'System: Unstable (Poles outside ROC)', 20, 50);
}

function toggleAnimation() {
    isAnimating = !isAnimating;
    if (isAnimating) animate();
    else cancelAnimationFrame(animFrameId);
}

function animate() {
    timeStep += 0.05;
    drawSimulation();
    animFrameId = requestAnimationFrame(animate);
}

function resetSimulation() {
    isAnimating = false;
    cancelAnimationFrame(animFrameId);
    timeStep = 0;
    document.getElementById('sliderAlpha').value = 0.50;
    document.getElementById('sliderOmega').value = 2.00;
    updateSimulation();
}

function checkAnswer(idx) {
    const feedback = document.getElementById('checkpointFeedback');
    feedback.style.display = 'block';
    if (idx === 1) {
        feedback.className = 'feedback-alert feedback-correct';
        feedback.innerHTML = '<strong>Correct!</strong> For a causal LTI system, all poles must lie strictly inside the unit circle |z| &lt; 1 for the unit circle to be within the ROC.';
    } else {
        feedback.className = 'feedback-alert feedback-wrong';
        feedback.innerHTML = '<strong>Incorrect.</strong> Recall that BIBO stability requires sum |h[n]| &lt; infinity, which means the Fourier Transform exists and the unit circle |z|=1 lies inside the ROC.';
    }
}
