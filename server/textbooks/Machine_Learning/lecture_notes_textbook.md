# Machine Learning: Comprehensive Lecture Notes & Theoretical Foundations

## 1. Deep Theoretical Foundations and Derivations

Machine Learning (ML) is fundamentally the study of algorithms that map input data to output predictions by optimizing a defined objective function over a hypothesis space, rather than being explicitly programmed. The core mathematical framework of ML relies on probability, linear algebra, and multivariate calculus.

### 1.1 The Statistical Learning Framework
Let $X \in \mathbb{R}^d$ be an input space and $Y$ be an output space. We assume there exists an unknown joint probability distribution $P(X, Y)$ over these spaces. 
The goal of a machine learning algorithm is to find a function (hypothesis) $h: X \rightarrow Y$ in a hypothesis class $\mathcal{H}$ that minimizes the **Expected Risk** (or True Error):

$$R(h) = \mathbb{E}_{(x,y) \sim P}[L(h(x), y)] = \int \int L(h(x), y) dP(x,y)$$

where $L(\cdot, \cdot)$ is a loss function (e.g., squared loss for regression, 0-1 loss for classification).
Since $P(X,Y)$ is unknown, we cannot compute $R(h)$ directly. Instead, we are given a training dataset $S = \{(x_1, y_1), \dots, (x_n, y_n)\}$ drawn i.i.d. from $P(X,Y)$. We approximate the expected risk using the **Empirical Risk**:

$$\hat{R}_S(h) = \frac{1}{n} \sum_{i=1}^n L(h(x_i), y_i)$$

The principle of **Empirical Risk Minimization (ERM)** states that we should choose the hypothesis $\hat{h}$ that minimizes the empirical risk.

### 1.2 The Bias-Variance Tradeoff (Derivation)
A cornerstone of ML theory is understanding generalization error. Suppose the true relationship is $y = f(x) + \epsilon$, where $\epsilon$ is zero-mean noise with variance $\sigma^2$. Let $\hat{f}(x)$ be the model learned from the data. The expected Mean Squared Error (MSE) at an unseen point $x$ evaluates to:

$$\mathbb{E}\left[(y - \hat{f}(x))^2\right] = \mathbb{E}\left[(f(x) + \epsilon - \hat{f}(x))^2\right]$$
$$= \mathbb{E}\left[(f(x) - \hat{f}(x))^2\right] + \mathbb{E}[\epsilon^2] + 2\mathbb{E}[\epsilon(f(x) - \hat{f}(x))]$$

Since $\epsilon$ is independent of $f(x)$ and $\hat{f}(x)$ and has mean zero, the cross-term vanishes. $\mathbb{E}[\epsilon^2] = \sigma^2$.
Expanding the first term by adding and subtracting $\mathbb{E}[\hat{f}(x)]$:

$$= \mathbb{E}\left[ (f(x) - \mathbb{E}[\hat{f}(x)] + \mathbb{E}[\hat{f}(x)] - \hat{f}(x))^2 \right] + \sigma^2$$
$$= \left( f(x) - \mathbb{E}[\hat{f}(x)] \right)^2 + \mathbb{E}\left[ (\mathbb{E}[\hat{f}(x)] - \hat{f}(x))^2 \right] + \text{Cross-term} + \sigma^2$$

The cross-term is $2(f(x) - \mathbb{E}[\hat{f}(x)]) \mathbb{E}[\mathbb{E}[\hat{f}(x)] - \hat{f}(x)]$. Since $\mathbb{E}[\mathbb{E}[\hat{f}(x)] - \hat{f}(x)] = 0$, it vanishes. Thus:

$$\text{Expected MSE} = \text{Bias}^2(\hat{f}(x)) + \text{Variance}(\hat{f}(x)) + \text{Irreducible Error}(\sigma^2)$$

This dictates that as model complexity increases, Bias decreases but Variance increases. Optimal learning requires finding the "sweet spot" minimizing the sum.

### 1.3 Linear Regression and the Normal Equation
Given a dataset with $n$ instances and $d$ features, let $X \in \mathbb{R}^{n \times (d+1)}$ be the design matrix (with a column of 1s for the bias term), and $y \in \mathbb{R}^n$ be the target vector. We model the hypothesis as $\hat{y} = X\theta$, where $\theta \in \mathbb{R}^{d+1}$ are the weights.
We minimize the Sum of Squared Errors (SSE) cost function:

$$J(\theta) = \frac{1}{2} (X\theta - y)^T (X\theta - y)$$
$$J(\theta) = \frac{1}{2} (\theta^T X^T X \theta - \theta^T X^T y - y^T X \theta + y^T y)$$
Since $\theta^T X^T y$ is a scalar, it equals its transpose $y^T X \theta$.
$$J(\theta) = \frac{1}{2} (\theta^T X^T X \theta - 2\theta^T X^T y + y^T y)$$

To find the minimum, we set the gradient with respect to $\theta$ to the zero vector:
$$\nabla_\theta J(\theta) = X^T X \theta - X^T y = 0$$
$$X^T X \theta = X^T y$$

Assuming $X^T X$ is invertible (which requires linear independence of features), we obtain the **Normal Equation**:
$$\theta = (X^T X)^{-1} X^T y$$

### 1.4 Support Vector Machines (SVM) - Dual Formulation
For binary classification with linearly separable data $y_i \in \{-1, 1\}$, a Hard Margin SVM finds a hyperplane $w^T x + b = 0$ maximizing the margin $\frac{2}{||w||}$.
**Primal Problem:**
$$\min_{w,b} \frac{1}{2} ||w||^2 \quad \text{subject to} \quad y_i(w^T x_i + b) \ge 1, \quad \forall i=1,\dots,n$$

To solve this, we construct the Lagrangian using multipliers $\alpha_i \ge 0$:
$$\mathcal{L}(w, b, \alpha) = \frac{1}{2} w^T w - \sum_{i=1}^n \alpha_i [y_i(w^T x_i + b) - 1]$$

Setting partial derivatives to zero:
$\nabla_w \mathcal{L} = w - \sum_{i=1}^n \alpha_i y_i x_i = 0 \implies w = \sum_{i=1}^n \alpha_i y_i x_i$
$\nabla_b \mathcal{L} = -\sum_{i=1}^n \alpha_i y_i = 0 \implies \sum_{i=1}^n \alpha_i y_i = 0$

Substituting these back yields the **Dual Problem** (which allows the Kernel trick by operating only on dot products $x_i^T x_j$):
$$\max_{\alpha} \sum_{i=1}^n \alpha_i - \frac{1}{2} \sum_{i=1}^n \sum_{j=1}^n \alpha_i \alpha_j y_i y_j x_i^T x_j$$
$$\text{subject to } \alpha_i \ge 0 \text{ and } \sum_{i=1}^n \alpha_i y_i = 0$$

---

## 2. Real-world Engineering Applications

1.  **Predictive Maintenance in Manufacturing:**
    Using IoT sensor data (vibration, temperature, pressure) from industrial machinery, Regression models (e.g., Random Forests, LSTMs) predict the Remaining Useful Life (RUL) of components. This minimizes downtime and avoids catastrophic machine failure.
2.  **Autonomous Navigation Systems:**
    Reinforcement Learning (RL) and Convolutional Neural Networks (CNNs) are employed in self-driving vehicles and autonomous drones. ML systems process LiDAR and camera feeds to perform real-time semantic segmentation, object tracking, and trajectory optimization.
3.  **Algorithmic Trading & Quantitative Finance:**
    Time-series forecasting models (ARIMA, GARCH, Transformers) are utilized to identify micro-patterns in stock market data. Advanced ML models calculate risk bounds and automate high-frequency trading strategies with latencies in microseconds.
4.  **Medical Diagnostics (Radiology):**
    Deep Learning models, specifically U-Nets and ResNets, process MRI and CT scans to classify and segment anomalies such as malignant tumors. They act as "second-reader" systems, achieving diagnostic accuracy on par with human expert panels.

---

## 3. Advanced GATE-Level Solved Examples

### **Example 1: Ridge Regression Dimensions**
**Problem:** In a ridge regression problem, the design matrix $X$ has dimensions $N \times d$. The regularized objective function is $J(W) = ||XW - Y||^2 + \lambda ||W||^2$. What is the dimension of the matrix $(X^TX + \lambda I)$ that must be inverted to find the optimal weights $W$?
**Solution:** 
1. The design matrix $X$ is $N \times d$.
2. The transpose $X^T$ is $d \times N$.
3. The matrix multiplication $X^T X$ results in a matrix of size $(d \times N) \times (N \times d) = d \times d$.
4. $\lambda I$ is a scalar multiplied by the identity matrix, which must match the dimensions of $X^TX$ to be added. Thus, $I$ is a $d \times d$ identity matrix.
5. The sum $(X^TX + \lambda I)$ is a $d \times d$ matrix.
**Answer:** $d \times d$

### **Example 2: Information Gain in Decision Trees**
**Problem:** A dataset $D$ has 100 examples, where 60 belong to class A and 40 belong to class B. A binary feature $F$ splits the dataset into two subsets: $D_1$ (40 examples, 30 of class A, 10 of class B) and $D_2$ (60 examples, 30 of class A, 30 of class B). Calculate the Information Gain of the split using entropy base 2.
**Solution:**
1. Initial Entropy $H(D) = -(0.6 \log_2 0.6 + 0.4 \log_2 0.4) \approx -(0.6 \times -0.737 + 0.4 \times -1.322) \approx 0.971$ bits.
2. Entropy of $D_1$: Class ratios are $30/40 = 0.75$ (A) and $10/40 = 0.25$ (B).
   $H(D_1) = -(0.75 \log_2 0.75 + 0.25 \log_2 0.25) = -(0.75 \times -0.415 + 0.25 \times -2) \approx 0.811$ bits.
3. Entropy of $D_2$: Class ratios are $30/60 = 0.5$ (A) and $30/60 = 0.5$ (B).
   $H(D_2) = -(0.5 \log_2 0.5 + 0.5 \log_2 0.5) = 1$ bit.
4. Expected Entropy after split $= \frac{|D_1|}{|D|} H(D_1) + \frac{|D_2|}{|D|} H(D_2)$
   $= (40/100) \times 0.811 + (60/100) \times 1 = 0.3244 + 0.6 = 0.9244$ bits.
5. Information Gain $= H(D) - \text{Expected Entropy} = 0.971 - 0.9244 = 0.0466$ bits.
**Answer:** $0.0466$ bits.

### **Example 3: Naive Bayes Probability Calculation**
**Problem:** A Naive Bayes classifier is trained on a binary classification task $(Y \in \{0,1\})$ with binary features $X_1, X_2 \in \{0,1\}$. Given the following probabilities estimated from data: $P(Y=1) = 0.4$, $P(X_1=1|Y=1) = 0.8$, $P(X_1=1|Y=0) = 0.3$, $P(X_2=1|Y=1) = 0.5$, $P(X_2=1|Y=0) = 0.6$. For a new sample $X = [1, 1]$, calculate the posterior probability $P(Y=1|X_1=1, X_2=1)$ assuming conditional independence.
**Solution:**
1. Using Bayes' Theorem: $P(Y=1|X_1=1, X_2=1) = \frac{P(X_1=1, X_2=1 | Y=1) P(Y=1)}{P(X_1=1, X_2=1)}$
2. By Naive Bayes assumption: $P(X_1, X_2 | Y) = P(X_1 | Y)P(X_2 | Y)$.
3. Numerator for $Y=1$: $P(X_1=1|1) \times P(X_2=1|1) \times P(Y=1) = 0.8 \times 0.5 \times 0.4 = 0.16$.
4. Term for $Y=0$: $P(X_1=1|0) \times P(X_2=1|0) \times P(Y=0) = 0.3 \times 0.6 \times 0.6 = 0.108$.
5. Evidence (Denominator) = Sum of numerator terms = $0.16 + 0.108 = 0.268$.
6. Posterior probability = $0.16 / 0.268 = 160 / 268 \approx 0.597$.
**Answer:** $0.597$

### **Example 4: SVM Geometric Margin**
**Problem:** In a 2D space, a linear SVM is trained on points belonging to two classes. The support vectors for class $+1$ are located at $(1, 2)$ and $(2, 1)$. The support vector for class $-1$ is at $(0, 0)$. Assuming a hard margin SVM, find the weight vector $w = (w_1, w_2)$ and bias $b$.
**Solution:**
1. For support vectors, the equation $y_i(w^T x_i + b) = 1$ holds strictly.
2. For class $+1$, we have $w_1(1) + w_2(2) + b = 1 \implies w_1 + 2w_2 + b = 1$ (Eq 1)
   And $w_1(2) + w_2(1) + b = 1 \implies 2w_1 + w_2 + b = 1$ (Eq 2)
3. For class $-1$, we have $w_1(0) + w_2(0) + b = -1 \implies b = -1$.
4. Substitute $b=-1$ into Eq 1 and 2:
   $w_1 + 2w_2 - 1 = 1 \implies w_1 + 2w_2 = 2$
   $2w_1 + w_2 - 1 = 1 \implies 2w_1 + w_2 = 2$
5. Subtracting the two gives $w_1 - w_2 = 0 \implies w_1 = w_2$.
6. Thus, $3w_1 = 2 \implies w_1 = 2/3$, $w_2 = 2/3$.
**Answer:** $w = [2/3, 2/3]^T$, $b = -1$

### **Example 5: K-Means Complexity**
**Problem:** What is the time complexity of a single iteration of the K-Means clustering algorithm given $N$ data points, $K$ clusters, and $d$ dimensions? 
**Solution:**
1. In a single iteration, K-Means performs two steps: Assignment and Update.
2. Assignment Step: For each of the $N$ points, the algorithm calculates the Euclidean distance to all $K$ cluster centroids. Calculating the distance between two $d$-dimensional vectors takes $O(d)$ time. Total time for assignment = $O(N \cdot K \cdot d)$.
3. Update Step: For each of the $K$ clusters, the algorithm computes the mean of all points assigned to it. Since there are $N$ points distributed among $K$ clusters, summing the $d$-dimensional vectors takes $O(N \cdot d)$ time. 
4. The dominant term is $O(N \cdot K \cdot d) + O(N \cdot d) \approx O(N \cdot K \cdot d)$.
**Answer:** $O(N K d)$

---

## 4. Practice Problems

**Q1.** Prove mathematically that the logistic function $\sigma(z) = \frac{1}{1 + e^{-z}}$ has the derivative $\sigma'(z) = \sigma(z)(1 - \sigma(z))$. Show how this simplifies the gradient descent update rule for Logistic Regression using Cross-Entropy Loss.

**Q2.** An SVM classifier is trained with a radial basis function (RBF) kernel $K(x, x') = \exp(-\gamma ||x - x'||^2)$. As the hyperparameter $\gamma \rightarrow \infty$, what happens to the training error and the testing error? Justify your answer using the concepts of bias and variance.

**Q3.** Given a transition probability matrix $P$ for a Markov Decision Process (MDP) and discount factor $\gamma \in (0,1)$, prove that the Bellman optimality operator is a contraction mapping, ensuring the convergence of Value Iteration.

**Q4.** Calculate the principal components of a dataset matrix $X = \begin{bmatrix} 1 & 2 \\ 3 & 4 \\ 5 & 6 \end{bmatrix}$ (assume data needs to be mean-centered first). Provide the exact eigenvalues and eigenvectors of the resulting covariance matrix.

**Q5.** In a K-Nearest Neighbors (KNN) classifier with large $N$ (number of training samples), demonstrate theoretically why the asymptotic error rate of the 1-NN rule is bounded above by twice the Bayes error rate.