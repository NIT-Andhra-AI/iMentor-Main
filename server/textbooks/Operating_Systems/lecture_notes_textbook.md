# Operating Systems: Comprehensive Textbook & GATE Reference Manual

---

## 1. Process Management and Threading Architecture

### 1.1 Process Abstraction and Memory Structure
A **process** is an instance of a computer program in execution. It represents the active entity in an operating system, contrasting with a **program**, which is a passive entity stored on disk (an executable binary). 

When a program is executed, the operating system allocates a dedicated **Logical Address Space (LAS)** for the process. In modern 32-bit or 64-bit architectures, this address space is organized into distinct segments:

```
+------------------------------------+ High Address (0xFFFFFFFF / 0x7FFFFFFFFFFF)
|         Kernel Space               | (Mapped to OS Kernel memory)
+------------------------------------+ 
|         User Stack                 | (Grows Downward)
|         |                          |
|         v                          |
|                                    |
|         ^                          |
|         |                          |
|         Heap                       | (Grows Upward via brk/sbrk/mmap)
+------------------------------------+
|  Uninitialized Data (.bss)         | (Global/static vars, zero-initialized)
+------------------------------------+
|  Initialized Data (.data)          | (Global/static vars with explicitly initialized values)
+------------------------------------+
|  Text / Code Segment (.text)       | (Executable machine instructions, Read-Only)
+------------------------------------+ Low Address (0x00000000)
```

1. **Text Segment (`.text`):** Contains the executable machine code. This region is marked read-only to prevent self-modifying code and is shared among multiple instances of the same program.
2. **Initialized Data Segment (`.data`):** Holds global and static variables explicitly initialized by the programmer (e.g., `int x = 42;`).
3. **Uninitialized Data Segment (`.bss`):** Stores uninitialized global and static variables. The kernel initializes this memory to zero upon process creation.
4. **Heap:** Dynamically allocated memory requested at runtime via system calls such as `brk()`, `sbrk()`, or `mmap()` (abstracted by standard library functions like `malloc()` or `new`). The heap grows upward toward higher memory addresses.
5. **Stack:** Manages function call frames, local automatic variables, function parameters, and return addresses. The stack grows downward toward lower memory addresses.

---

### 1.2 Process State Transitions
The lifecycle of a process is modeled by state transition diagrams. In advanced operating systems supporting swapping, the system is modeled using a **7-State Process Transition Model**.

```
         +-------------------------------------------------------+
         |                                                       |
         v                                                       |
    +---------+  Admit   +---------+  Activate  +---------+      |
--->|   NEW   |--------->| SUSPEND |----------->|  READY  |      |
    +---------+          |  READY  |<-----------|         |      |
                         +---------+   Suspend  +---------+      |
                              ^                      |           |
                              |                      | Schedule  |
                              | Suspend              v           |
                         +---------+            +---------+      | Time Quantum Exp /
                         | SUSPEND |            | RUNNING |------| Preemption
                         | BLOCKED |            +---------+      |
                         +---------+                 |           |
                              ^                      | Event     |
                              | Suspend              | Wait      |
                              |                      v           |
                              +-----------------+---------+      |
                                   Activate     | BLOCKED |<-----+
                                                +---------+
                                                     |
                                                     v
                                                +------------+
                                                | TERMINATED |
                                                +------------+
```

#### Process States:
1. **NEW:** The process is being created. Memory structures and the PCB are being initialized.
2. **READY:** The process is loaded into primary memory and is waiting to be assigned to a CPU core by the short-term scheduler.
3. **RUNNING:** Instructions are actively being executed on the CPU core.
4. **BLOCKED / WAITING:** The process cannot execute until an I/O operation completes or a synchronization signal is received.
5. **TERMINATED:** Execution has completed or was halted by an unhandled signal/exception. OS reclaims memory and data structures.
6. **SUSPENDED READY:** The process is ready for execution but has been swapped out from primary memory to secondary storage (swap space) due to memory pressure.
7. **SUSPENDED BLOCKED:** The process is blocked waiting for an event and has been swapped out to secondary storage.

#### State Transitions:
* **Admit:** Process moves from NEW to READY (or SUSPENDED READY) when accepted by the long-term scheduler.
* **Dispatch / Schedule:** Short-term scheduler selects a process from READY to RUNNING.
* **Time Quantum Expiration / Preemption:** Preemptive scheduler moves process from RUNNING to READY.
* **Event Wait:** Process executes a blocking system call (e.g., `read()`), moving from RUNNING to BLOCKED.
* **Event Completion:** I/O or event resolves; process moves from BLOCKED to READY.
* **Suspend (Swap Out):** Medium-term scheduler moves BLOCKED/READY processes to SUSPENDED BLOCKED/READY on disk to free up physical RAM.
* **Activate (Swap In):** Swapped-out process is brought back to primary memory.

---

### 1.3 Process Control Block (PCB) and Kernel Representation
The **Process Control Block (PCB)** (represented in Linux as `struct task_struct`) is the fundamental kernel data structure containing all metadata necessary to manage a process.

#### Core Fields of PCB:
* **Process Identification (PID):** Unique integer identifier assigned by OS.
* **Process State:** Current state (Running, Ready, Blocked, etc.).
* **Program Counter (PC):** Memory address of the next instruction to execute.
* **CPU Registers:** Saved context (e.g., accumulators, index registers, stack pointer `ESP`/`RSP`, general-purpose registers) when the process is suspended.
* **CPU Scheduling Information:** Process priority, pointers to scheduling queues, virtual runtime counters.
* **Memory Management Information:** Page table base pointer (e.g., `CR3` register in x86), segment tables, page bounds.
* **Accounting Information:** Execution time, CPU time limits, process age.
* **I/O and File State:** List of open file descriptors (`struct files_struct`), allocated I/O devices, root/working directories.

---

### 1.4 Context Switching Mechanics
A **context switch** is the procedure by which the CPU shifts execution from one process/thread to another. It requires storing the state of the running process and restoring the state of the target process.

#### Detailed Context Switch Steps:
1. **Interrupt / Trap Trigger:** A hardware timer interrupt, I/O interrupt, or explicit system call trap (`syscall`) transfers CPU control to the kernel mode vector table.
2. **Save Mode Context:** Processor automatically pushes hardware context (`CS`, `RIP`, `EFLAGS`, `SS`, `RSP`) onto the current kernel stack.
3. **Save Register Context:** The kernel code saves remaining general-purpose registers onto the process's PCB or kernel stack.
4. **Execute Scheduler:** The short-term scheduler algorithm selects the next process \(P_{next}\) from the ready queue.
5. **Update State:** Current process state changes from RUNNING to READY or BLOCKED. \(P_{next}\) state changes to RUNNING.
6. **Switch Memory Context:** The CPU's memory management unit (MMU) register (e.g., `CR3` in x86) is reloaded with the address of \(P_{next}\)'s page table. This invalidates non-global **Translation Lookaside Buffer (TLB)** entries unless Address Space Identifiers (ASID) are supported by the hardware.
7. **Restore Context:** Restore \(P_{next}\)'s saved register context from its kernel stack/PCB.
8. **Return from Interrupt (`IRET` / `SYSRET`):** Execution pops \(P_{next}\)'s program counter and control state, dropping execution privilege back to User Mode at \(P_{next}\)'s instruction boundary.

#### Mathematical Modeling of Context Switch Latency:
Let \(T_{total}\) be the execution time of a workload under non-preemptive ideal condition. If context switches occur at frequency \(f_{cs}\) with individual switch latency \(T_{cs}\), the effective CPU utilization \(\eta\) and execution overhead are:

$$\eta = \frac{T_{total}}{T_{total} + N_{cs} \cdot T_{cs}} = \frac{1}{1 + f_{cs} \cdot T_{cs}}$$

Where \(N_{cs}\) is total context switches performed. Context switch overhead includes direct execution cost (saving/restoring registers) and indirect cost (TLB misses, CPU cache pollution).

---

### 1.5 Dual-Mode Execution and System Calls
To prevent user programs from accessing hardware directly or corrupting OS memory, modern microprocessors enforce hardware dual-mode execution controlled by a privilege bit (e.g., Ring 0 vs. Ring 3 in x86).

```
+-------------------------------------------------------------------------+
|                              USER MODE (Ring 3)                         |
|  User Application                                                       |
|       |                                                                 |
|       | Call standard library functions (e.g., fopen, printf)           |
|       v                                                                 |
|  C Library (glibc)                                                      |
|       |                                                                 |
|       | Loads Syscall Number into RAX register, sets arguments          |
|       | Triggers Software Interrupt / TRAP Instruction (e.g., SYSCALL)  |
+-------|-----------------------------------------------------------------+
        | Hardware Mode Switch (Ring 3 -> Ring 0, User -> Kernel Mode)
+-------v-----------------------------------------------------------------+
|                              KERNEL MODE (Ring 0)                       |
|  System Call Vector Table Lookup -> Syscall Handler                     |
|       |                                                                 |
|       | Validates arguments, checks access permissions                  |
|       v                                                                 |
|  Kernel Services (VFS, Memory Manager, Device Drivers)                  |
|       |                                                                 |
|       | Returns result status code to RAX register                      |
|       | Executes SYSRET / IRET Instruction                              |
+-------|-----------------------------------------------------------------+
        | Hardware Mode Switch (Ring 0 -> Ring 3, Kernel -> User Mode)
        v
   Control returns to User Program
```

#### Process Creation Semantics: `fork()`, `execve()`, `wait()`, and `exit()`
* **`fork()`:** Duplicates the calling process. It creates a child process with an exact copy of the parent's address space, file descriptors, and CPU context.
  * *Copy-On-Write (COW):* To eliminate expensive physical memory copying during `fork()`, parent and child share the same physical memory pages initially, marked as **Read-Only**. When either process attempts to write to a page, a page fault exception occurs. The kernel catches this exception, allocates a new physical frame, copies the single page content, updates the faulting process's page table to point to the new frame with Write permissions, and resumes execution.
  * Return values: `fork()` returns `0` inside the child process, and returns the child's `PID` inside the parent process (or `-1` on error).
* **`execve()`:** Replaces the current process image (code, data, stack, heap) with a new binary program from disk. The PID remains unchanged.
* **`wait()` / `waitpid()`:** Blocks the parent process until one of its child processes terminates. Returns the exit status of the child and reclaims child's kernel PCB records.
* **Special States:**
  * **Zombie Process:** A child process that has finished execution (via `exit()`), but its parent has not yet called `wait()`. The child's address space is freed, but its entry in the process table (PCB) remains to store its exit code.
  * **Orphan Process:** A child process whose parent terminated while the child is still executing. Orphans are inherited by the top-level init/systemd process (PID 1), which periodically calls `wait()` to reap terminated orphans.

---

### 1.6 Multithreading Paradigms and Models
A **Thread** is the fundamental unit of CPU utilization. It comprises a Thread ID, a Program Counter (PC), a Register Set, and a Stack. Threads belonging to the same process share the Text, Data, Heap segments, and OS resources (open files, signals).

```
Single-Threaded Process                   Multi-Threaded Process
+-----------------------------------+     +-----------------------------------+
| Code | Data | Files | Heap        |     | Code | Data | Files | Heap        |
+-----------------------------------+     +-----------------------------------+
| Stack | Registers | PC            |     | Stack1 | Stack2 | Stack3          |
|       |           |               |     | Regs1  | Regs2  | Regs3           |
|       |           |               |     | PC1    | PC2    | PC3             |
+-----------------------------------+     +-----------------------------------+
```

#### User-Level Threads (ULT) vs. Kernel-Level Threads (KLT):
* **User-Level Threads (ULT):** Thread management is performed entirely by a user-space library without kernel intervention. Thread switching does not require kernel mode traps (fast). However, if one ULT issues a blocking system call, the entire process (and all sibling ULTs) blocks.
* **Kernel-Level Threads (KLT):** Threads are natively managed and scheduled by the OS kernel. Blocking one thread does not block others. Thread creation and switching require system calls, introducing kernel overhead.

#### Threading Models:
1. **Many-to-One Model:** Multiple ULTs mapped to a single KLT. Fast switching, but cannot exploit multi-core parallel processing; single blocking call halts all threads.
2. **One-to-One Model:** Each ULT maps to a dedicated KLT (e.g., Linux NPTL, Windows threads). Supports true multi-core parallel execution. Higher resource consumption.
3. **Many-to-Many Model:** Multiplexes \(M\) ULTs onto \(N\) KLTs (\(M \ge N\)). Provides concurrent efficiency while bound to hardware capabilities.

---

## 2. CPU Scheduling Theory and Algorithms

### 2.1 Scheduling Metrics and Definitions
* **Arrival Time (\(AT\)):** Instant when process enters the Ready Queue.
* **Burst Time (\(BT\)):** Total CPU time required for completion.
* **Completion Time (\(CT\)):** Instant when execution finishes.
* **Turnaround Time (\(TAT\)):** Total duration spent in the system.
  $$TAT = CT - AT$$
* **Waiting Time (\(WT\)):** Total time spent waiting in the Ready Queue.
  $$WT = TAT - BT$$
* **Response Time (\(RT\)):** Duration from process arrival to its first allocation of the CPU.
  $$RT = \text{Time of First Execution} - AT$$
* **Throughput:** Number of processes completed per unit time.
* **CPU Utilization:** Ratio of CPU active execution time to total elapsed time.

---

### 2.2 Classic CPU Scheduling Algorithms

#### 1. First-Come, First-Served (FCFS)
* **Policy:** Non-preemptive. Processes are dispatched strictly in order of arrival.
* **Disadvantage:** **Convoy Effect**. Short processes arriving immediately behind a long CPU-bound process suffer high waiting times, degrading average waiting time.

#### 2. Shortest Job First (SJF) / Shortest Remaining Time First (SRTF)
* **SJF (Non-preemptive):** Selects the process with the smallest CPU burst time among available processes.
* **SRTF (Preemptive variant of SJF):** If a newly arrived process has a shorter remaining burst time than the currently running process, the running process is preempted.
* **Optimality Theorem:** *SJF / SRTF is mathematically optimal with respect to minimizing average waiting time for a static set of processes.*

##### Mathematical Proof of Optimality for Non-Preemptive SJF:
Consider \(n\) processes arriving simultaneously at time \(t=0\) with burst times \(P = \{p_1, p_2, \dots, p_n\}\). Let execution order be defined by a permutation \(\pi\) where process \(\pi(i)\) executes in the \(i\)-th position.
The waiting time for the process executing at position \(k\) is:

$$WT_{\pi(k)} = \sum_{j=1}^{k-1} BT_{\pi(j)}$$

The sum of all waiting times is:

$$\sum_{k=1}^{n} WT_{\pi(k)} = \sum_{k=1}^{n} \sum_{j=1}^{k-1} BT_{\pi(j)} = \sum_{i=1}^{n} (n - i) \cdot BT_{\pi(i)}$$

To minimize this weighted summation \(\sum_{i=1}^{n} (n - i) \cdot BT_{\pi(i)}\), the sequence of coefficients \((n-1), (n-2), \dots, 0\) requires that burst times are sorted in strictly non-decreasing order:

$$BT_{\pi(1)} \le BT_{\pi(2)} \le \dots \le BT_{\pi(n)}$$

Hence, SJF yields the absolute minimum total and average waiting time. \(\blacksquare\)

* **Limitation:** Starvation of long processes if short processes continuously arrive; requires advance knowledge of CPU burst times (approximated in practice using exponential averaging: \(\tau_{n+1} = \alpha t_n + (1-\alpha)\tau_n\)).

#### 3. Priority Scheduling
* **Policy:** Each process is assigned an explicit numerical priority. The CPU is allocated to the process with the highest priority (convention varies: lowest integer = highest priority). Can be preemptive or non-preemptive.
* **Pathologies:** **Starvation** (indefinite blocking).
* **Mitigation:** **Aging**—gradually increasing the priority of processes that wait in the system for long durations.
* **Priority Inversion Problem:** Occurs when a high-priority process \(P_H\) is indirectly preempted by a medium-priority process \(P_M\), because \(P_H\) is waiting on a lock held by a low-priority process \(P_L\).
  * *Solution:* **Priority Inheritance Protocol (PIP)**. When \(P_H\) requests a lock held by \(P_L\), process \(P_L\) temporarily inherits \(P_H\)'s high priority level until it releases the shared lock.

#### 4. Round-Robin (RR)
* **Policy:** Preemptive. Designed for time-sharing systems. Each process receives a fixed slice of CPU time called a **Time Quantum (\(q\))**. If the process does not complete within \(q\), it is preempted and returned to the tail of the Ready Queue.
* **Performance Dependency on \(q\):**
  * As \(q \to \infty\), RR degrades to FCFS.
  * As \(q \to 0\), RR approaches ideal **Processor Sharing**, where \(n\) processes execute concurrently on a CPU running at \(\frac{1}{n}\) speed. However, context switch overhead (\(T_{cs}\)) imposes a lower bound on practical quantum selection. If \(q \approx T_{cs}\), overhead dominates, causing severe degradation.

#### 5. Multi-Level Feedback Queue (MLFQ)
* **Mechanics:** Consists of multiple distinct ready queues (\(Q_0, Q_1, \dots, Q_k\)) with different priority levels and time quanta.
  * New processes enter top queue \(Q_0\) with small quantum \(q_0\).
  * If a process exhausts its quantum without completing, it is demoted to lower queue \(Q_1\) with larger quantum \(q_1 > q_0\).
  * I/O-bound processes remain in high-priority queues because they relinquish the CPU before quantum expiration.
  * Processes that sit in lower queues for extended periods are periodically boosted to higher queues to prevent starvation.

---

### 2.3 Real-World Case Study: Linux Completely Fair Scheduler (CFS)
Instead of using fixed time slices, the modern Linux scheduler (CFS) models an "ideal multi-tasking CPU" on real hardware using an algorithm with \(O(\log N\)) complexity.

* **Virtual Runtime (`vruntime`):** Tracks the amount of execution time assigned to a thread, normalized by its priority (`nice` level).
  $$vruntime_i \mathrel{+}= \Delta \text{exec\_time} \times \frac{Load_{default}}{Load_i}$$
* **Data Structure:** Tasks are indexed in a self-balancing **Red-Black Tree** ordered strictly by their `vruntime` values.
* **Scheduling Decision:** The scheduler always picks the leftmost node of the Red-Black Tree (task with minimum `vruntime`). This guarantees fair CPU allocation proportional to process weights.

---

## 3. Process Synchronization and Deadlocks

### 3.1 The Critical Section Problem
When concurrent processes share mutable data, uncoordinated accesses can produce unpredictable execution outputs (**Race Conditions**). A code segment accessing shared resources is a **Critical Section (CS)**.

#### Requirements for a Valid Solution to CS Problem:
1. **Mutual Exclusion:** If process \(P_i\) is executing in its CS, no other process can execute in its CS.
2. **Progress:** If no process is executing in its CS and some processes wish to enter their CS, only those processes not executing in their remainder section can participate in deciding which process enters next. Selection cannot be postponed indefinitely.
3. **Bounded Waiting:** A bound must exist on the number of times other processes are allowed to enter their critical sections after a process has made a request to enter its critical section and before that request is granted (prevents starvation).
4. **Architectural Independence:** Assumptions regarding relative CPU speeds or hardware processor counts must not be required.

---

### 3.2 Software Solutions: Peterson's Algorithm
Peterson's Algorithm is a classic software solution for two processes (\(P_0\) and \(P_1\)) enforcing all three Critical Section properties.

#### Code Structure for Process \(P_i\) (where \(j = 1 - i\)):
```c
// Shared variables:
bool flag[2] = {false, false}; // flag[i] indicates if P_i is ready to enter CS
int turn;                      // Indicates whose turn it is to enter CS

void process_i() {
    while (true) {
        flag[i] = true;        // Express intent to enter
        turn = j;              // Give turn to the other process (polite delegation)
        
        while (flag[j] && turn == j) {
            // Busy wait (spin lock)
        }
        
        // --- CRITICAL SECTION ---
        
        flag[i] = false;       // Exit section: clear intent
        
        // --- REMAINDER SECTION ---
    }
}
```

#### Theoretical Verification of Peterson's Algorithm:

##### 1. Proof of Mutual Exclusion:
Assume towards contradiction that both \(P_0\) and \(P_1\) are executing inside their Critical Sections simultaneously at time \(t\).
For \(P_0\) to be in CS, its `while` loop condition must have evaluated to `false`. This implies either `flag[1] == false` or `turn == 0`.
Similarly, for \(P_1\) to be in CS, either `flag[0] == false` or `turn == 1`.
Since both are in CS, `flag[0] == true` and `flag[1] == true`. Thus, we must have `turn == 0` for \(P_0\) and `turn == 1` for \(P_1\).
However, variable `turn` is a shared scalar memory location and can hold only one value (`0` or `1`) at any instantaneous time \(t\). Contradiction. Hence, Mutual Exclusion holds.

##### 2. Proof of Progress:
A process \(P_i\) can be blocked from entering its CS only if it is stuck in the `while(flag[j] && turn == j)` loop.
If \(P_j\) does not wish to enter its CS, `flag[j] == false`, so \(P_i\) passes the while loop immediately.
If both processes want to enter simultaneously (`flag[0] == flag[1] == true`), `turn` will be assigned either `0` or `1`. If `turn == 0`, \(P_0\) enters; if `turn == 1`, \(P_1\) enters. The process not favored by `turn` waits, but the choice is immediate and execution proceeds without deadlocking. Thus, Progress holds.

##### 3. Proof of Bounded Waiting:
Suppose \(P_0\) is waiting in its while loop while \(P_1\) is in CS. When \(P_1\) exits its CS, it sets `flag[1] = false`, immediately freeing \(P_0\) from its while loop.
If \(P_1\) tries to re-enter its CS immediately, it sets `flag[1] = true` and explicitly assigns `turn = 0`. Since `flag[0]` is still `true`, \(P_1\) will be forced to wait in its while loop, allowing \(P_0\) to enter. Hence, \(P_0\) waits at most one entry by \(P_1\). Bounded Waiting holds. \(\blacksquare\)

---

### 3.3 Hardware Primitives for Synchronization
Modern architectures support atomic hardware instructions executing read-modify-write sequences atomically at the bus level.

#### 1. Test-And-Set (TAS):
```c
bool TestAndSet(bool *target) {
    bool rv = *target;
    *target = true; // Atomically sets value to true and returns original value
    return rv;
}
```
*Spinlock usage:*
```c
while (TestAndSet(&lock)); // Busy wait
// Critical Section
lock = false;
```

#### 2. Compare-And-Swap (CAS):
```c
int CompareAndSwap(int *value, int expected, int new_value) {
    int temp = *value;
    if (temp == expected) {
        *value = new_value;
    }
    return temp; // Returns original value
}
```
*Spinlock usage:*
```c
while (CompareAndSwap(&lock, 0, 1) != 0); // Busy wait
// Critical Section
lock = 0;
```

---

### 3.4 Semaphores and Mutex Abstractions
A **Semaphore** \(S\) is an integer variable accessed exclusively through two standard atomic operations: `wait()` (historically designated \(P\)) and `signal()` (designated \(V\)).

#### Operations Definition:
```c
typedef struct {
    int value;
    struct process *queue; // Queue of blocked processes
} semaphore;

void wait(semaphore *S) {
    S->value--;
    if (S->value < 0) {
        // Add current process to S->queue
        block(); // Transition to BLOCKED state
    }
}

void signal(semaphore *S) {
    S->value++;
    if (S->value <= 0) {
        // Remove a process P from S->queue
        wakeup(P); // Transition P to READY state
    }
}
```

#### Properties of Semaphore Values:
* If \(S.value \ge 0\): Represents the number of available resource units.
* If \(S.value < 0\): Absolute magnitude \(|S.value|\) represents the number of processes currently blocked in the semaphore queue.

---

### 3.5 Classical Synchronization Problems

#### 1. Bounded-Buffer (Producer-Consumer) Problem
* **Shared Resources:** Buffer array of capacity \(N\).
* **Semaphores Used:**
  * `mutex = 1` (Binary semaphore for mutual exclusion on buffer index manipulation).
  * `empty = N` (Counting semaphore tracking unallocated buffer slots).
  * `full = 0` (Counting semaphore tracking slots containing produced items).

```c
// Producer Process                    // Consumer Process
void producer() {                      void consumer() {
    while(true) {                          while(true) {
        item item = produce_item();            wait(&full);
        wait(&empty);                          wait(&mutex);
        wait(&mutex);                          
                                               item item = remove_item();
        insert_item(item);                     
                                               signal(&mutex);
        signal(&mutex);                        signal(&empty);
        signal(&full);                         consume_item(item);
    }                                      }
}                                      }
```
*Critical Note:* Swapping `wait(&empty)` and `wait(&mutex)` causes an immediate **Deadlock** if the buffer becomes full.

#### 2. Readers-Writers Problem (First Variant: Reader-Preference)
* **Goal:** Multiple readers can read simultaneously, but writers require exclusive access.

```c
// Shared Variables:
int read_count = 0;
semaphore mutex = 1; // Protects read_count updates
semaphore rw_mutex = 1; // Exclusive access for writer or first reader

// Writer Process                      // Reader Process
void writer() {                        void reader() {
    wait(&rw_mutex);                       wait(&mutex);
    // Write Data                          read_count++;
    signal(&rw_mutex);                     if (read_count == 1) {
}                                              wait(&rw_mutex); // First reader locks writer out
                                           }
                                           signal(&mutex);
                                           
                                           // Read Data
                                           
                                           wait(&mutex);
                                           read_count--;
                                           if (read_count == 0) {
                                               signal(&rw_mutex); // Last reader frees writer
                                           }
                                           signal(&mutex);
                                       }
```

---

### 3.6 Deadlock Theory, Prevention, Avoidance, and Detection
A **Deadlock** is a state where a set of processes are permanently blocked because each process holds a resource required by another process in the set.

#### Necessary Conditions for Deadlock (Coffman Conditions):
All four conditions must hold simultaneously for a deadlock to occur:
1. **Mutual Exclusion:** At least one resource must be held in a non-shareable mode.
2. **Hold and Wait:** A process must be holding at least one resource and waiting to acquire additional resources currently held by other processes.
3. **No Preemption:** Resources cannot be forcibly taken from a process; they can only be released voluntarily after the process completes its task.
4. **Circular Wait:** A closed chain of processes \(\{P_0, P_1, \dots, P_n\}\) exists such that \(P_0\) waits for a resource held by \(P_1\), \(P_1\) waits for a resource held by \(P_2\), and \(P_n\) waits for a resource held by \(P_0\).

---

#### Deadlock Handling Strategies:

##### 1. Deadlock Prevention
Restricts resource requests by invalidating at least one of the four necessary conditions *a priori*.
* **Eliminate Hold and Wait:** Require processes to request all needed resources simultaneously before execution begins (low resource utilization).
* **Allow Preemption:** If a process holding resources is denied a new request, all its currently held resources are preempted.
* **Eliminate Circular Wait:** Impose a total linear ordering function \(F: R \to \mathbb{N}\) over all resource types. Require that processes request resources strictly in increasing order of enumeration (\(F(r_i) < F(r_j)\)).

##### 2. Deadlock Avoidance: Banker's Algorithm
Requires advance declarations of maximum resource claims per process. The system dynamically monitors state transitions to ensure a **Safe State** exists.

**Data Structures (\(n\) processes, \(m\) resource types):**
* \(Available[m]\): Vector of unallocated resource instances.
* \(Max[n][m]\): Maximum resource demand matrix for each process.
* \(Allocation[n][m]\): Resources currently assigned to each process.
* \(Need[n][m] = Max[n][m] - Allocation[n][m]\): Remaining resource requirements.

```
Banker's Safety Algorithm:
1. Initialize Work = Available (vector of size m)
   Initialize Finish[i] = false for i = 0, 1, ..., n-1

2. Find an index i such that:
   a) Finish[i] == false
   b) Need[i] <= Work
   If no such i exists, go to Step 4.

3. Work = Work + Allocation[i]
   Finish[i] = true
   Go to Step 2.

4. If Finish[i] == true for all i, the system is in a SAFE state.
   Otherwise, the system is in an UNSAFE state (Deadlock potential exists).
```

```
Resource-Request Algorithm for Process P_i (Request_i vector):
1. If Request_i <= Need[i], proceed to Step 2. Otherwise, raise error (exceeded max claim).
2. If Request_i <= Available, proceed to Step 3. Otherwise, P_i must wait (insufficient resources).
3. Tentatively modify matrices:
   Available = Available - Request_i
   Allocation[i] = Allocation[i] + Request_i
   Need[i] = Need[i] - Request_i

4. Run Safety Algorithm on tentative state.
   If SAFE -> Grant Request.
   If UNSAFE -> Roll back state modification; P_i is suspended and must wait.
```

---

## 4. Memory Management & Virtual Memory Architecture

### 4.1 Memory Allocation and Partitioning Policies
* **Internal Fragmentation:** Memory allocated to a process is larger than requested; unassigned padding space within the allocated partition is wasted.
* **External Fragmentation:** Total free physical memory is sufficient to satisfy an allocation request, but free space is split into non-contiguous fragments.

#### Dynamic Memory Allocation Placement Algorithms:
Given a set of free holes in memory and a requested size \(S\):
1. **First Fit:** Allocates the *first* available hole starting from the beginning of memory that is large enough (\(\text{Size} \ge S\)). Fast search execution.
2. **Best Fit:** Searches the entire list and allocates the *smallest* hole that is large enough (\(\text{Size} \ge S\)). Minimizes leftover space per allocation, but creates tiny unusable external fragments.
3. **Worst Fit:** Searches the entire list and allocates the *largest* available hole. Leaves behind large remaining holes, but degrades memory utilization over time.
4. **Next Fit:** Identical to First Fit, but starts searching from the location of the previous allocation.

---

### 4.2 Non-Contiguous Memory Architecture: Paging
Paging divides physical memory into fixed-size blocks called **Frames** and logical memory into blocks of equal size called **Pages**.

```
Logical Address (Generated by CPU):
+------------------------+-----------------------+
|  Page Number (p)       |  Offset (d)           |
+------------------------+-----------------------+
            |                        |
            v                        |
     +--------------+                |
     | Page Table   |                |
     | Frame (f)    |                |
     +--------------+                |
            |                        |
            v                        v
Physical Address (Sent to RAM):
+------------------------+-----------------------+
|  Frame Number (f)      |  Offset (d)           |
+------------------------+-----------------------+
```

#### Mathematical Address Resolution Equations:
Let:
* Logical Address Space (\(LAS\)) = \(2^m\) bytes.
* Physical Address Space (\(PAS\)) = \(2^p\) bytes.
* Page Size (\(PS\)) = Frame Size (\(FS\)) = \(2^n\) bytes.

Then:
* Number of bits in Logical Address = \(m\).
* Offset bits (\(d\)) = \(n\).
* Page Number bits (\(p_{bits}\)) = \(m - n\).
* Frame Number bits (\(f_{bits}\)) = \(p - n\).
* Total Pages in LAS = \(\frac{2^m}{2^n} = 2^{m-n}\).
* Page Table Size (\(PTS\)) = \(\text{Number of Pages} \times \text{Page Table Entry Size (PTE)}\).

$$PTS = 2^{m-n} \times \text{PTE\_Size}$$

---

### 4.3 Translation Lookaside Buffer (TLB) & Effective Access Time
A **TLB** is a high-speed associative hardware cache holding recent page-table mappings.

```
CPU Logical Address (p, d)
        |
        +---> [ TLB Search ] 
                    |
           +--------+--------+
           |                 |
     (TLB Hit)         (TLB Miss)
           |                 |
           v                 v
    Get Frame (f)     Access Page Table in RAM
           |          Get Frame (f), Update TLB
           |                 |
           +--------+--------+
                    |
                    v
      Combine Frame (f) + Offset (d)
       Access Physical Memory (RAM)
```

#### Mathematical Derivation of Effective Access Time (EAT):
Let:
* \(h\) = TLB Hit Ratio (\(0 \le h \le 1\)).
* \(\epsilon\) = TLB Search Access Latency time.
* \(t_{m}\) = Main Memory Access Latency time.
* \(k\) = Levels of Paging (e.g., \(k=1\) for single-level, \(k=2\) for two-level).

##### Single-Level Paging EAT:
$$\text{EAT} = h \cdot (\epsilon + t_m) + (1 - h) \cdot (\epsilon + 2 \cdot t_m)$$

##### \(k\)-Level Hierarchical Paging EAT:
On a TLB miss, resolving a physical address requires traversal across \(k\) level page tables in memory, plus 1 final memory access for data fetch:

$$\text{EAT} = h \cdot (\epsilon + t_m) + (1 - h) \cdot (\epsilon + (k + 1) \cdot t_m)$$

---

### 4.4 Multi-Level Paging Architecture
Single-level page tables for large address spaces (e.g., 64-bit systems) require unacceptably large contiguous memory allocations. Multi-level paging divides the page table itself into smaller pageable units.

#### Two-Level Paging Scheme:
A logical address is split into:
```
+---------------------+--------------------+-------------------+
| Page Dir Index (p1) | Page Table Index (p2)| Offset (d)        |
+---------------------+--------------------+-------------------+
```
To guarantee that every page table fits inside a **single memory frame**, the inner page index bits (\(p_2\)) must satisfy:

$$2^{p_2} \times \text{PTE\_Size} \le \text{Page Size } (2^n)$$

$$p_2 \le n - \log_2(\text{PTE\_Size})$$

---

### 4.5 Virtual Memory and Page Replacement Algorithms
**Virtual Memory** decouples user logical memory from physical memory, allowing the execution of processes whose total memory requirements exceed physical RAM.

#### Demand Paging & Page Fault Handling Sequence:
1. CPU references a logical address.
2. MMU checks Page Table entry. If the **Valid/Invalid Bit** is set to `0` (Invalid), a **Page Fault Trap** is triggered.
3. OS receives trap; switches execution to Kernel Page Fault Handler.
4. OS validates whether the access address was a valid memory mapping:
   * If invalid access \(\implies\) Send `SIGSEGV` (Segmentation Fault).
   * If valid access \(\implies\) Fetch requested page from Swap Space on secondary disk.
5. OS locates a free physical frame in RAM:
   * If free frame exists \(\implies\) Assign frame.
   * If no free frame exists \(\implies\) Run **Page Replacement Algorithm** to select a **victim frame**. Write victim page to disk if its **Dirty Bit** is set to `1`.
6. Read requested page into allocated physical frame.
7. Update faulting process's Page Table (set Frame Number, valid bit = `1`, reset dirty bit).
8. Restart the instruction interrupted by the page fault trap.

#### Mathematical EAT Model under Page Fault Probability (\(p\)):
Let \(p\) be the Page Fault Rate (\(0 \le p \le 1\)), \(t_m\) be main memory access time, and \(PFST\) be the Page Fault Service Time (disk read/write delay).

$$\text{EAT} = (1 - p) \cdot t_m + p \cdot PFST$$

---

#### Classic Page Replacement Algorithms:

##### 1. First-In, First-Out (FIFO)
Replaces the page that was brought into memory earliest.
* **Pathology:** **Belady's Anomaly**. For some page replacement algorithms (specifically non-stack algorithms like FIFO), the page fault rate may *increase* as the number of allocated physical memory frames increases.

##### 2. Optimal Page Replacement (OPT / MIN / Belady's OPT)
Replaces the page that will not be used for the longest period in the future.
* *Status:* Theoretical benchmark algorithm; impossible to implement in real-time OS due to non-deterministic future reference requirements.

##### 3. Least Recently Used (LRU)
Replaces the page that has not been referenced for the longest period of time.
* *Inclusion Property (Stack Algorithm):* LRU is a Stack Algorithm; it satisfies \(M(y, t) \subseteq M(y+1, t)\), where \(M(n, t)\) represents the set of pages in memory with \(n\) frames at time \(t\). **LRU can never suffer from Belady's Anomaly.**

##### 4. Second-Chance (Clock) Algorithm
Approximates LRU using a single **Reference Bit** per entry and a circular queue pointer.
* If pointer references page with `Reference Bit == 1`: Clear bit to `0`, advance pointer (grant second chance).
* If pointer references page with `Reference Bit == 0`: Select this frame as the victim for replacement.

---

### 4.6 Thrashing and Working-Set Model
**Thrashing** occurs when a system spends more time servicing page faults and executing swapping I/O operations than performing useful computation. This happens when the total physical RAM is smaller than the combined **Locality of Reference** requirements of all active processes.

```
CPU Utilization
   ^
100|          /|
   |         / |  <-- Thrashing Threshold
   |        /  |
   |       /   |\
   |      /    | \
  0+---------------------> Degree of Multiprogramming (Number of processes)
```

#### Working-Set Model Formulation:
Let \(\Delta\) be the **Working-Set Window** (a fixed parameter of page references).
The **Working-Set Size (\(WSS_i\))** for process \(P_i\) is the total number of unique pages referenced in the most recent \(\Delta\) time units.

Total system demand for frames:

$$D = \sum_{i=1}^{m} WSS_i$$

* If \(D > \text{Total Available Physical Frames } (S)\): Thrashing occurs.
* *OS Action:* Suspend (swap out) one or more active processes to drop \(D \le S\).

---

## 5. File Systems and Secondary Storage Management

### 5.1 Directory Structures and Links
* **Hard Link:** Creates a new directory entry pointing directly to the same underlying **Inode** number on disk. File data persists until all hard links (tracked via inode's reference counter `i_nlink`) and open file descriptors are removed. Hard links cannot span across different file system partitions.
* **Symbolic (Soft) Link:** A special file whose data content contains the path string of another file. If the original target file is deleted, the symbolic link becomes a dangling pointer. Can cross file system boundaries.

---

### 5.2 UNIX Inode Memory Architecture
The UNIX Inode (Index Node) contains metadata for a file (permissions, owner, size, timestamps) and a fixed-size array of block pointers.

```
Inode Structure:
+-----------------------------------+
| File Metadata (Mode, Size, etc.)  |
+-----------------------------------+
| Direct Pointers [0 to N-1]        |----> Data Block
+-----------------------------------+
| Single Indirect Pointer           |----> Block of Direct Pointers
+-----------------------------------+
| Double Indirect Pointer           |----> Block of Single Indirect Pointers
+-----------------------------------+
| Triple Indirect Pointer           |----> Block of Double Indirect Pointers
+-----------------------------------+
```

#### Generalized Maximum File Size Derivation:
Let:
* Block Size = \(B\) bytes.
* Disk Block Address Pointer Size = \(P\) bytes.
* Number of Direct Pointers = \(D\).
* Pointers per Indirect Block = \(K = \lfloor \frac{B}{P} \rfloor\).

The maximum file size supported by this Inode structure is:

$$\text{Max File Size} = \left[ D + K + K^2 + K^3 \right] \times B$$

---

### 5.3 File Allocation Methods
1. **Contiguous Allocation:** Each file occupies a set of contiguous blocks on disk.
   * *Advantages:* Fast sequential and direct random access reads.
   * *Disadvantages:* External fragmentation, file size expansion requires pre-allocation or relocation.
2. **Linked Allocation:** Each file is a linked list of disk blocks; blocks contain data and a pointer to the next block.
   * *Advantages:* Zero external fragmentation.
   * *Disadvantages:* Poor random access performance (\(O(n)\) traversal delay), pointer overhead reduces available data payload per block.
3. **Indexed Allocation (FAT / Inode):** Brings all pointers together into an Index Block. Supports efficient direct random access without external fragmentation.

---

### 5.4 Secondary Storage Structure and Disk Scheduling
Total latency to access a disk sector on a hard disk drive (HDD):

$$T_{\text{access}} = T_{\text{seek}} + T_{\text{rotational}} + T_{\text{transfer}}$$

* **Seek Time (\(T_{\text{seek}}\)):** Time to move the read/write head arm to the targeted cylinder track.
* **Rotational Latency (\(T_{\text{rotational}}\)):** Time for the target sector to rotate underneath the head.
  $$\text{Average } T_{\text{rotational}} = \frac{1}{2} \cdot \left( \frac{60}{\text{RPM}} \right) \text{ seconds}$$
* **Transfer Time (\(T_{\text{transfer}}\)):** Time to read/write data payload bytes.
  $$T_{\text{transfer}} = \frac{\text{Data Size (Bytes)}}{\text{Transfer Rate (Bytes/sec)}}$$

---

#### Disk Head Scheduling Algorithms:
Given a request track queue and initial head position:
1. **FCFS:** Services tracks in raw request order. Highly inefficient due to long arm movements.
2. **SSTF (Shortest Seek Time First):** Selects the request with minimum seek distance from current head position.
   * *Pathology:* Starvation of distant track requests.
3. **SCAN (Elevator Algorithm):** Head sweeps back and forth across the entire disk, servicing requests along its current direction until reaching the end track, then reverses direction.
4. **C-SCAN (Circular SCAN):** Head moves in one direction only, servicing requests until it hits the end track. It then immediately returns to track `0` without servicing any requests on the return sweep, providing a more uniform wait time.
5. **LOOK / C-LOOK:** Variants of SCAN/C-SCAN where the head arm only moves as far as the final request in each direction, rather than sweeping to the physical edge of the disk.

---

## 6. Advanced GATE-Level Solved Examples

### Problem 1: Multi-Level Virtual Memory & EAT Analysis
**Question:**
Consider a 32-bit virtual address space system using a 3-level paging scheme. The page size is 4 KB (\(4096\) bytes). The page table entry (PTE) size is 4 bytes at all levels.
The physical memory access time is \(100\text{ ns}\), and the TLB access time is \(10\text{ ns}\). The system incorporates a TLB with a hit ratio of \(95\%\).
When a page fault occurs, it takes a total service time of \(10\text{ ms}\) (\(10,000,000\text{ ns}\)).
Assume that page fault handling occurs only on TLB misses, with a page fault probability of \(p = 0.001\%\) (\(10^{-5}\)) per miss.

1. Derive the address bit-split structure for the 3-level page table.
2. Calculate the exact Effective Access Time (EAT) of the system.

#### Detailed Solution:

##### Part 1: Bit Split Derivation
* Virtual Address Size = \(32\) bits. Total Virtual Address Space = \(2^{32}\) bytes.
* Page Size = \(4\text{ KB} = 4096\text{ bytes} = 2^{12}\) bytes.
* Offset bits (\(d\)) = \(\log_2(2^{12}) = 12\) bits.
* Total Page Number bits (\(p_{\text{total}}\)) = \(32 - 12 = 20\) bits.
* Number of entries per single page-sized page table:
  $$\text{Entries per page} = \frac{\text{Page Size}}{\text{PTE Size}} = \frac{4096}{4} = 1024 = 2^{10} \text{ entries}$$
* This means each lower page table level can handle up to \(10\) bits of indexing.
* For a 3-level paging structure:
  * Level 3 Page Index (\(p_3\)) = \(10\) bits.
  * Level 2 Page Index (\(p_2\)) = \(10\) bits.
  * Level 1 Page Dir Index (\(p_1\)) = \(20 - (10 + 10) = 0\) bits. (Wait, let's verify: \(p_1 + p_2 + p_3 = 20\) bits. Splitting 20 bits across 3 levels: \(p_1 = 2\) bits, \(p_2 = 9\) bits, \(p_3 = 9\) bits if uniform, or \(p_1 = 2, p_2 = 9, p_3 = 9\). But using standard frame bounds of \(2^{10}\) entries per frame: Level 3 takes 10 bits, Level 2 takes 10 bits, leaving Level 1 with 0 bits, which collapses to 2 levels! To strictly split 20 bits into 3 levels where each sub-table fits inside a frame: \(p_1 = 2\text{ bits}, p_2 = 9\text{ bits}, p_3 = 9\text{ bits}\), or \(p_1 = 4, p_2 = 8, p_3 = 8\).)
* Using standard 3-level partitioning where lower tables are full frames (\(10\) bits):
  * \(p_1 = 2\) bits (Outer Page Directory)
  * \(p_2 = 9\) bits (Middle Page Directory)
  * \(p_3 = 9\) bits (Inner Page Table)
  * \(d = 12\) bits (Byte Offset)
  $$\text{Address Split: } [p_1: 2\text{ bits}] \, | \, [p_2: 9\text{ bits}] \, | \, [p_3: 9\text{ bits}] \, | \, [d: 12\text{ bits}]$$

##### Part 2: EAT Calculation
For 3-level paging, resolving a memory reference on a TLB miss requires looking up 3 page tables in RAM before accessing the target location (total 4 memory accesses).

Let:
* \(h = 0.95\)
* \(\epsilon = 10\text{ ns}\)
* \(t_m = 100\text{ ns}\)
* \(PFST = 10,000,000\text{ ns}\)
* \(p = 10^{-5}\) (Page fault rate per miss)

Execution Paths:
1. **TLB Hit (Probability \(h = 0.95\)):**
   $$T_{\text{hit}} = \epsilon + t_m = 10 + 100 = 110\text{ ns}$$
2. **TLB Miss without Page Fault (Probability \((1-h)(1-p) = 0.05 \times (1 - 10^{-5})\)):**
   Access requires searching TLB (\(10\text{ ns}\)) + accessing 3 levels of page tables (\(3 \times 100\text{ ns}\)) + accessing physical target frame (\(100\text{ ns}\)).
   $$T_{\text{miss\_nopaf}} = \epsilon + (3 + 1) \cdot t_m = 10 + 400 = 410\text{ ns}$$
3. **TLB Miss with Page Fault (Probability \((1-h) \cdot p = 0.05 \times 10^{-5}\)):**
   $$T_{\text{miss\_paf}} = \epsilon + 4 \cdot t_m + PFST = 410 + 10,000,000 = 10,000,410\text{ ns}$$

Combining all paths into EAT:
$$\text{EAT} = h \cdot T_{\text{hit}} + (1 - h) \cdot \left[ (1 - p) \cdot T_{\text{miss\_nopaf}} + p \cdot T_{\text{miss\_paf}} \right]$$

Substitute the component values:
$$\text{Cost on TLB Miss} = (1 - 10^{-5}) \cdot 410 + 10^{-5} \cdot 10,000,410$$
$$= 410 \cdot (1 - 10^{-5}) + 100.0041 = 409.9959 + 100.0041 = 510\text{ ns}$$

Now multiply by miss probability and add hit time:
$$\text{EAT} = 0.95 \cdot (110) + 0.05 \cdot (510)$$
$$\text{EAT} = 104.5 + 25.5 = 130\text{ ns}$$

$$\mathbf{\text{Final Answer: EAT} = 130\text{ ns}}$$

---

### Problem 2: Semaphore Concurrency & Value State Space
**Question:**
Three processes \(P_1, P_2,\) and \(P_3\) concurrently execute the code blocks shown below. Shared counting semaphores `S1` and `S2` are initialized to `1` and `0`, respectively. Shared variable `x` is initialized to `10`.

```c
// Process P1              // Process P2              // Process P3
wait(&S1);                 wait(&S2);                 wait(&S1);
x = x + 5;                 x = x * 2;                 x = x - 2;
signal(&S2);               signal(&S1);               signal(&S1);
```

Determine all possible final values of the shared variable `x` upon completion of all three processes, along with the corresponding execution traces.

#### Detailed Solution:

Let us track semaphore constraints and process dependencies:
* Initial state: `S1 = 1`, `S2 = 0`, `x = 10`.

**Analysis of Lock Dependencies:**
* `P2` begins with `wait(&S2)`. Since `S2` is initialized to `0`, `P2` is immediately blocked. `P2` cannot execute `x = x * 2` until either `P1` executes `signal(&S2)`.
* `P1` and `P3` both begin with `wait(&S1)`. Since `S1 = 1`, either `P1` or `P3` can win the initial race to decrement `S1` and enter its region.

Let's evaluate all valid execution sequences (interleavings):

##### Sequence 1: `P1` executes first, then `P2`, then `P3`
1. `P1` executes `wait(&S1)` \(\implies S1 = 0\).
2. `P1` executes `x = x + 5` \(\implies x = 10 + 5 = 15\).
3. `P1` executes `signal(&S2)` \(\implies S2 = 1\). (`P1` terminates).
4. Now `P2` unblocks from `wait(&S2)` \(\implies S2 = 0\).
5. `P2` executes `x = x * 2` \(\implies x = 15 \times 2 = 30\).
6. `P2` executes `signal(&S1)` \(\implies S1 = 1\). (`P2` terminates).
7. `P3` unblocks from `wait(&S1)` \(\implies S1 = 0\).
8. `P3` executes `x = x - 2` \(\implies x = 30 - 2 = 28\).
9. `P3` executes `signal(&S1)` \(\implies S1 = 1\).
*Resulting Value:* **\(x = 28\)**

##### Sequence 2: `P3` executes first, then `P1`, then `P2`
1. `P3` executes `wait(&S1)` \(\implies S1 = 0\).
2. `P3` executes `x = x - 2` \(\implies x = 10 - 2 = 8\).
3. `P3` executes `signal(&S1)` \(\implies S1 = 1\). (`P3` terminates).
4. `P1` executes `wait(&S1)` \(\implies S1 = 0\).
5. `P1` executes `x = x + 5` \(\implies x = 8 + 5 = 13\).
6. `P1` executes `signal(&S2)` \(\implies S2 = 1\). (`P1` terminates).
7. `P2` unblocks from `wait(&S2)` \(\implies S2 = 0\).
8. `P2` executes `x = x * 2` \(\implies x = 13 \times 2 = 26\).
9. `P2` executes `signal(&S1)` \(\implies S1 = 1\). (`P2` terminates).
*Resulting Value:* **\(x = 26\)**

##### Can `P3` execute after `P1` but before `P2`?
When `P1` finishes `x = x + 5` (making \(x = 15\)), it executes `signal(&S2)` which makes `S2 = 1`. `P1` does NOT signal `S1`!
`S1` remains `0`.
Therefore, `P3` (which requires `wait(&S1)`) CANNOT execute immediately after `P1`! Only `P2` can run because `P2` is waiting on `S2`.
`P2` must execute next, multiply `x` by 2, and then call `signal(&S1)`, which finally unblocks `P3`.

Thus, no other interleaving permits completion without deadlocking.

$$\mathbf{\text{Final Set of Possible Values for } x: \{26, 28\}}$$

---

### Problem 3: Banker's Algorithm State Safety Matrix Verification
**Question:**
Consider a system with 4 processes (\(P_0, P_1, P_2, P_3\)) and 3 resource types (\(R_1, R_2, R_3\)).
The resource allocation state at time \(t_0\) is given by the matrices:

$$\text{Allocation} = \begin{bmatrix} 1 & 2 & 1 \\ 2 & 0 & 1 \\ 0 & 1 & 2 \\ 1 & 1 & 0 \end{bmatrix}, \quad \text{Max} = \begin{bmatrix} 3 & 3 & 2 \\ 4 & 2 & 2 \\ 1 & 3 & 3 \\ 2 & 2 & 1 \end{bmatrix}$$

Total resource vector in the system is \(E = [7, 6, 5]\).

1. Compute the \(Need\) matrix.
2. Determine if the system is currently in a Safe State by providing a complete Safety Sequence trace.
3. If process \(P_2\) requests additional resources \(Request_2 = [1, 0, 1]\), determine if the system can grant the request immediately.

#### Detailed Solution:

##### Step 1: Calculate Total Allocated Resources and Available Vector
Sum allocated instances per resource column:
$$\text{Allocated } R_1 = 1 + 2 + 0 + 1 = 4$$
$$\text{Allocated } R_2 = 2 + 0 + 1 + 1 = 4$$
$$\text{Allocated } R_3 = 1 + 1 + 2 + 0 = 4$$

$$\text{Total Allocated Vector} = [4, 4, 4]$$

Now compute \(Available = E - \text{Total Allocated}\):
$$Available = [7, 6, 5] - [4, 4, 4] = [3, 2, 1]$$

##### Step 2: Compute \(Need\) Matrix (\(Need = Max - Allocation\))
$$\text{Need} = \begin{bmatrix} 3-1 & 3-2 & 2-1 \\ 4-2 & 2-0 & 2-1 \\ 1-0 & 3-1 & 3-2 \\ 2-1 & 2-1 & 1-0 \end{bmatrix} = \begin{bmatrix} 2 & 1 & 1 \\ 2 & 2 & 1 \\ 1 & 2 & 1 \\ 1 & 1 & 1 \end{bmatrix}$$

##### Step 3: Run Safety Algorithm on Initial State
* Initialize \(Work = Available = [3, 2, 1]\).
* Initialize \(Finish = [\text{False}, \text{False}, \text{False}, \text{False}]\).

*Iteration 1:*
Check processes with \(Finish[i] == \text{False}\) and \(Need[i] \le Work\):
* \(P_0\): \(Need[0] = [2, 1, 1] \le [3, 2, 1]\)? **TRUE**.
  * Select \(P_0\).
  * \(Work = Work + Allocation[0] = [3, 2, 1] + [1, 2, 1] = [4, 4, 2]\).
  * \(Finish[0] = \text{True}\).

*Iteration 2:*
Current \(Work = [4, 4, 2]\).
* \(P_1\): \(Need[1] = [2, 2, 1] \le [4, 4, 2]\)? **TRUE**.
  * Select \(P_1\).
  * \(Work = Work + Allocation[1] = [4, 4, 2] + [2, 0, 1] = [6, 4, 3]\).
  * \(Finish[1] = \text{True}\).

*Iteration 3:*
Current \(Work = [6, 4, 3]\).
* \(P_2\): \(Need[2] = [1, 2, 1] \le [6, 4, 3]\)? **TRUE**.
  * Select \(P_2\).
  * \(Work = Work + Allocation[2] = [6, 4, 3] + [0, 1, 2] = [6, 5, 5]\).
  * \(Finish[2] = \text{True}\).

*Iteration 4:*
Current \(Work = [6, 5, 5]\).
* \(P_3\): \(Need[3] = [1, 1, 1] \le [6, 5, 5]\)? **TRUE**.
  * Select \(P_3\).
  * \(Work = Work + Allocation[3] = [6, 5, 5] + [1, 1, 0] = [7, 6, 5]\).
  * \(Finish[3] = \text{True}\).

All processes finished. The system is in a **Safe State**.
$$\text{Valid Safe Sequence: } \langle P_0, P_1, P_2, P_3 \rangle$$

##### Step 4: Evaluate Request by Process \(P_2\) (\(Request_2 = [1, 0, 1]\))
1. Check \(Request_2 \le Need[2]\):
   $$[1, 0, 1] \le [1, 2, 1] \implies \mathbf{TRUE}$$
2. Check \(Request_2 \le Available\):
   $$[1, 0, 1] \le [3, 2, 1] \implies \mathbf{TRUE}$$
3. Create Tentative State:
   $$\text{Available}_{\text{new}} = Available - Request_2 = [3, 2, 1] - [1, 0, 1] = [2, 2, 0]$$
   $$\text{Allocation}[2]_{\text{new}} = Allocation[2] + Request_2 = [0, 1, 2] + [1, 0, 1] = [1, 1, 3]$$
   $$\text{Need}[2]_{\text{new}} = Need[2] - Request_2 = [1, 2, 1] - [1, 0, 1] = [0, 2, 0]$$

4. Test Safety of Tentative State (\(Work = [2, 2, 0]\)):
   * \(P_0\): \(Need[0] = [2, 1, 1] \le [2, 2, 0]\)? False (\(1 \not\le 0\)).
   * \(P_1\): \(Need[1] = [2, 2, 1] \le [2, 2, 0]\)? False.
   * \(P_2\): \(Need[2] = [0, 2, 0] \le [2, 2, 0]\)? **TRUE**!
     * Select \(P_2\).
     * \(Work = [2, 2, 0] + Allocation[2]_{\text{new}} = [2, 2, 0] + [1, 1, 3] = [3, 3, 3]\).
     * \(Finish[2] = \text{True}\).
   * Now with \(Work = [3, 3, 3]\):
     * \(P_0\): \(Need[0] = [2, 1, 1] \le [3, 3, 3]\)? **TRUE**.
       * Select \(P_0 \implies Work = [3, 3, 3] + [1, 2, 1] = [4, 5, 4]\).
     * \(P_1\): \(Need[1] = [2, 2, 1] \le [4, 5, 4]\)? **TRUE**.
       * Select \(P_1 \implies Work = [4, 5, 4] + [2, 0, 1] = [6, 5, 5]\).
     * \(P_3\): \(Need[3] = [1, 1, 1] \le [6, 5, 5]\)? **TRUE**.
       * Select \(P_3 \implies Work = [7, 6, 5]\).

A safe sequence \(\langle P_2, P_0, P_1, P_3 \rangle\) exists for the tentative state.

$$\mathbf{\text{Conclusion: Request can be granted immediately.}}$$

---

### Problem 4: UNIX Inode File Capacity & Storage Overhead Analysis
**Question:**
A UNIX file system uses an Inode structure containing:
* 12 Direct Block Pointers
* 1 Single Indirect Pointer
* 1 Double Indirect Pointer
* 1 Triple Indirect Pointer

The disk block size is \(8\text{ KB}\) (\(8192\text{ bytes}\)). Disk block addresses are 64-bit (\(8\text{ bytes}\)) integers.

1. Compute the theoretical Maximum File Size supported by this inode layout.
2. Determine the total disk space (Data Blocks + Index Blocks) consumed to store a file of size \(30\text{ MB}\) (\(30 \times 2^{20}\text{ bytes}\)).

#### Detailed Solution:

##### Part 1: Maximum File Size Calculation
* Block Size \(B = 8192\) bytes.
* Pointer Size \(P = 8\) bytes.
* Block Address Capacity per Index Block:
  $$K = \frac{B}{P} = \frac{8192}{8} = 1024 = 2^{10} \text{ pointers}$$

Addressable capacity per pointer tier:
1. **Direct Capacity:**
   $$C_{\text{direct}} = 12 \times 8\text{ KB} = 96\text{ KB}$$
2. **Single Indirect Capacity:**
   $$C_{\text{single}} = K \times B = 1024 \times 8\text{ KB} = 8192\text{ KB} = 8\text{ MB}$$
3. **Double Indirect Capacity:**
   $$C_{\text{double}} = K^2 \times B = 1024^2 \times 8\text{ KB} = 1,048,576 \times 8\text{ KB} = 8\text{ GB}$$
4. **Triple Indirect Capacity:**
   $$C_{\text{triple}} = K^3 \times B = 1024^3 \times 8\text{ KB} = 1,073,741,824 \times 8\text{ KB} = 8\text{ TB}$$

Total Maximum File Size:
$$\text{Max Size} = 96\text{ KB} + 8\text{ MB} + 8\text{ GB} + 8\text{ TB} \approx 8.0078\text{ TB}$$

##### Part 2: Overhead Calculation for 30 MB File
Target File Size = \(30\text{ MB} = 30 \times 1024 \times 1024\text{ bytes} = 31,457,280\text{ bytes}\).

1. **Number of Data Blocks Required:**
   $$\text{Data Blocks} = \left\lceil \frac{31,457,280}{8192} \right\rceil = \frac{31,457,280}{8192} = 3840\text{ blocks}$$

2. **Allocation Distribution Across Inode Pointer Tiers:**
   * Tier 1 (Direct): Accommodates first \(12\) data blocks.
     * Remaining blocks needed = \(3840 - 12 = 3828\) blocks.
   * Tier 2 (Single Indirect): Accommodates up to \(1024\) data blocks.
     * Consumes \(1024\) data blocks.
     * Requires **1 Single Indirect Index Block**.
     * Remaining blocks needed = \(3828 - 1024 = 2804\) blocks.
   * Tier 3 (Double Indirect): Accommodates remaining \(2804\) data blocks.
     * Requires 1 **Master Double Indirect Index Block**.
     * How many secondary index blocks are needed under the Double Indirect master block?
       $$\text{Secondary Index Blocks} = \left\lceil \frac{2804}{1024} \right\rceil = \lceil 2.738 \rceil = 3\text{ index blocks}$$
     * Total index blocks consumed in Double Indirect tier = \(1 + 3 = 4\text{ index blocks}\).

3. **Total Index Blocks Consumed:**
   $$\text{Total Index Blocks} = 0 \text{ (Direct)} + 1 \text{ (Single Ind)} + 4 \text{ (Double Ind)} = 5\text{ index blocks}$$

4. **Total Physical Disk Overhead:**
   $$\text{Total Disk Blocks} = 3840 \text{ (Data)} + 5 \text{ (Index)} = 3845\text{ blocks}$$
   $$\text{Total Storage Consumed} = 3845 \times 8\text{ KB} = 30,760\text{ KB} = 30.039\text{ MB}$$

$$\mathbf{\text{Final Answer: Total Storage Allocated} = 30.039\text{ MB (3845 blocks)}}$$

---

### Problem 5: Preemptive Scheduling with Context Switch Latency
**Question:**
Consider the following set of processes arriving at the Ready Queue with execution burst times and priorities.

| Process | Arrival Time (\(AT\)) | Burst Time (\(BT\)) | Priority (Lower value = Higher) |
| :--- | :--- | :--- | :--- |
| \(P_1\) | 0 ms | 7 ms | 3 |
| \(P_2\) | 1 ms | 4 ms | 1 |
| \(P_3\) | 2 ms | 2 ms | 2 |
| \(P_4\) | 4 ms | 5 ms | 2 |

Execution follows **Shortest Remaining Time First (SRTF)** scheduling.
Account for a context switch overhead latency of \(T_{cs} = 1\text{ ms}\) whenever execution transitions between different processes. (Context switch time is spent exclusively on CPU overhead; no process executes its burst during a switch).

Draw the execution Gantt chart, and compute:
1. Average Turnaround Time (\(TAT\)).
2. Average Waiting Time (\(WT\)).
3. Percentage CPU overhead caused by context switching.

#### Detailed Solution:

Let's trace process execution step by step:

* **\(t = 0\):** \(P_1\) arrives (\(BT = 7\)). It is the only process in the system. CPU switches to \(P_1\) (Context switch \(0 \to 1\text{ ms}\)).
* **\(t = 1\):** \(P_1\) starts running. \(P_2\) arrives at \(t = 1\) (\(BT = 4\)).
  * At \(t = 1\), \(P_1\)'s remaining burst = \(7\). \(P_2\)'s remaining burst = \(4\).
  * Since \(4 < 7\), \(P_2\) preempts \(P_1\)!
  * CPU spends \(1\text{ ms}\) on context switch from \(P_1\) to \(P_2\) (\(t = 1 \to 2\text{ ms}\)).
* **\(t = 2\):** \(P_3\) arrives (\(BT = 2\)). \(P_2\) is scheduled to execute.
  * Remaining bursts at \(t = 2\): \(P_1 = 7\), \(P_2 = 4\), \(P_3 = 2\).
  * Shortest remaining time is \(P_3\) (\(2\text{ ms}\))! \(P_3\) preempts \(P_2\) before \(P_2\) could even execute a single instruction.
  * Context switch from \(P_2\) to \(P_3\) takes \(1\text{ ms}\) (\(t = 2 \to 3\text{ ms}\)).
* **\(t = 3\):** \(P_3\) begins execution.
  * Executing \(P_3\) from \(t = 3 \to 4\): Remaining \(P_3 = 1\). \(P_4\) arrives at \(t = 4\) (\(BT = 5\)).
  * Remaining bursts at \(t = 4\): \(P_1 = 7\), \(P_2 = 4\), \(P_3 = 1\), \(P_4 = 5\).
  * \(P_3\) still has the shortest remaining time (\(1\text{ ms}\)). \(P_3\) continues running without preemption.
* **\(t = 5\):** \(P_3\) finishes execution (\(CT_{P_3} = 5\)).
  * Available processes: \(P_1 (7)\), \(P_2 (4)\), \(P_4 (5)\).
  * Shortest job is \(P_2\) (\(4\text{ ms}\)).
  * Context switch to \(P_2\) takes \(1\text{ ms}\) (\(t = 5 \to 6\text{ ms}\)).
* **\(t = 6\):** \(P_2\) executes for \(4\text{ ms}\) (\(t = 6 \to 10\text{ ms}\)).
* **\(t = 10\):** \(P_2\) finishes execution (\(CT_{P_2} = 10\)).
  * Available processes: \(P_1 (7)\), \(P_4 (5)\).
  * Shortest job is \(P_4\) (\(5\text{ ms}\)).
  * Context switch to \(P_4\) takes \(1\text{ ms}\) (\(t = 10 \to 11\text{ ms}\)).
* **\(t = 11\):** \(P_4\) executes for \(5\text{ ms}\) (\(t = 11 \to 16\text{ ms}\)).
* **\(t = 16\):** \(P_4\) finishes execution (\(CT_{P_4} = 16\)).
  * Available processes: \(P_1 (7)\).
  * Context switch to \(P_1\) takes \(1\text{ ms}\) (\(t = 16 \to 17\text{ ms}\)).
* **\(t = 17\):** \(P_1\) executes for \(7\text{ ms}\) (\(t = 17 \to 24\text{ ms}\)).
* **\(t = 24\):** \(P_1\) finishes execution (\(CT_{P_1} = 24\)).

##### Execution Timeline (Gantt Chart):
```
| CS | CS | CS | P3 | CS | P2 | CS | P4 | CS | P1 |
0    1    2    3    5    6   10   11   16   17   24
```

##### Process Metrics Metrics Calculation Table:

| Process | \(AT\) | \(BT\) | Completion Time (\(CT\)) | Turnaround Time (\(TAT = CT - AT\)) | Waiting Time (\(WT = TAT - BT\)) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| \(P_1\) | 0 | 7 | 24 | \(24 - 0 = 24\) | \(24 - 7 = 17\) |
| \(P_2\) | 1 | 4 | 10 | \(10 - 1 = 9\) | \(9 - 4 = 5\) |
| \(P_3\) | 2 | 2 | 5 | \(5 - 2 = 3\) | \(3 - 2 = 1\) |
| \(P_4\) | 4 | 5 | 16 | \(16 - 4 = 12\) | \(12 - 5 = 7\) |

##### Performance Summaries:
1. **Average Turnaround Time:**
   $$\text{Avg } TAT = \frac{24 + 9 + 3 + 12}{4} = \frac{48}{4} = 12.0\text{ ms}$$

2. **Average Waiting Time:**
   $$\text{Avg } WT = \frac{17 + 5 + 1 + 7}{4} = \frac{30}{4} = 7.5\text{ ms}$$

3. **CPU Overhead Percentage:**
   Total time elapsed = \(24\text{ ms}\).
   Total useful CPU execution time (\(\sum BT\)) = \(7 + 4 + 2 + 5 = 18\text{ ms}\).
   Total Context Switch Overhead time (\(N_{cs} \times T_{cs}\)) = 6 switches \(\times 1\text{ ms} = 6\text{ ms}\).

   $$\text{CPU Overhead Percentage} = \frac{6}{24} \times 100\% = 25.0\%$$

---

## 7. Comprehensive Practice Problems

### Problem 1 (NAT - Process Management)
A process creates 3 child processes using `fork()`. Each child process further creates 2 child processes of its own. Assuming all `fork()` calls complete successfully, what is the total number of processes generated in the system (including the original root process)?

### Problem 2 (MCQ - CPU Scheduling Bounds)
Consider five processes \(P_1, P_2, P_3, P_4, P_5\) arriving simultaneously at time \(t=0\) with burst times of \(3, 5, 1, 8,\) and \(4\) time units respectively. Which of the following scheduling algorithms yields the minimum average response time?
* (A) Round-Robin with quantum \(q = 2\)
* (B) Non-Preemptive Priority Scheduling
* (C) Shortest Job First (SJF)
* (D) First-Come, First-Served (FCFS)

### Problem 3 (NAT - Semaphore Value Invariant)
A counting semaphore `S` is initialized to `7`. A total of \(15\) `wait()` operations and \(9\) `signal()` operations are executed on `S` in arbitrary order across concurrent threads. What is the final value of the semaphore `S`?

### Problem 4 (NAT - Virtual Memory Paging)
A computer system supports a 48-bit virtual address space with a page size of \(8\text{ KB}\). If each Page Table Entry (PTE) requires \(8\text{ bytes}\), and the system uses hierarchical multi-level paging where every page table must fit completely inside a single physical memory frame, how many paging levels are required?

### Problem 5 (MCQ - Belady's Anomaly Criteria)
Which of the following page replacement algorithms CANNOT exhibit Belady's Anomaly under any memory access sequence?
* (A) FIFO and Second-Chance
* (B) LRU and Optimal
* (C) FIFO and LRU
* (D) Second-Chance and Optimal

### Problem 6 (NAT - Effective Access Time)
In a demand-paged virtual memory system, memory access time is \(80\text{ ns}\). Servicing a page fault takes \(8\text{ ms}\) if the victim page is not dirty, and \(20\text{ ms}\) if the victim page is dirty. 
Suppose that \(70\%\) of replaced pages are dirty. If the maximum tolerable Effective Access Time (EAT) is \(160\text{ ns}\), calculate the maximum allowable page fault rate \(p\).

### Problem 7 (NAT - Banker's Deadlock Limit)
A system contains \(R = 6\) identical instances of a resource type. There are \(N\) active processes competing for this resource. Each process requires a maximum of \(3\) resource instances to complete execution. What is the maximum value of \(N\) such that the system is guaranteed to be completely free from deadlocks?

### Problem 8 (NAT - Disk Access Time Calculations)
A hard disk rotates at \(7200\text{ RPM}\). The average seek time is \(6\text{ ms}\). The disk controller transfers data at a rate of \(50\text{ MB/sec}\). Calculate the total time required to locate and read a block of size \(16\text{ KB}\) from disk.

### Problem 9 (MCQ - Inode Link Dynamics)
Suppose a user creates a file `data.txt` and establishes a hard link `link_h` and a symbolic link `link_s` pointing to `data.txt`. The original file `data.txt` is subsequently deleted. What happens when a user attempts to read from `link_h` and `link_s`?
* (A) Reading `link_h` succeeds; reading `link_s` fails.
* (B) Reading `link_h` fails; reading `link_s` succeeds.
* (C) Reading both links fails.
* (D) Reading both links succeeds.

### Problem 10 (NAT - Disk Arm Head Scheduling)
A disk drive has 200 tracks (numbered 0 to 199). The head is currently at track 53. The queue of track requests in FIFO order is: `[98, 183, 37, 122, 14, 124, 65, 67]`. Calculate the total head movement (in tracks) using the **C-LOOK** disk scheduling algorithm, assuming the head is moving toward higher-numbered tracks.

---

## 8. Complete Answer Key & Solutions

### Solution to Problem 1:
* Original process = 1.
* Root process calls `fork()` 3 times:
  * First fork creates 1 child.
  * Second fork creates 1 child from root, plus 1 child from the first child.
  * Third fork creates 4 children across all existing processes.
  * Total processes from root forks = \(2^3 = 8\) processes.
* Each of these 8 processes creates 2 child processes \(\implies 8 \times 2 = 16\) new children.
* Total Processes = \(8 + 16 = 24\).
* **Answer:** `24`

### Solution to Problem 2:
* Shortest Job First (SJF) schedules shortest jobs first, providing the lowest waiting and response times.
* **Answer:** `(C)`

### Solution to Problem 3:
* Initial value = `7`.
* Operation change: \(\Delta S = (+1 \times \text{signals}) - (1 \times \text{waits}) = 9 - 15 = -6\).
* Final value = \(7 - 6 = 1\).
* **Answer:** `1`

### Solution to Problem 4:
* Virtual address space = \(48\) bits.
* Page size = \(8\text{ KB} = 2^{13}\) bytes \(\implies Offset = 13\) bits.
* Total Page Number bits = \(48 - 13 = 35\) bits.
* Entries per page table frame = \(\frac{8192}{8} = 1024 = 2^{10} \implies 10\) bits per level.
* Number of levels required = \(\left\lceil \frac{35}{10} \right\rceil = 4\) levels.
* **Answer:** `4`

### Solution to Problem 5:
* LRU and Optimal are stack algorithms and cannot suffer from Belady's Anomaly.
* **Answer:** `(B)`

### Solution to Problem 6:
* Average Page Fault Service Time:
  $$PFST = (0.30 \times 8\text{ ms}) + (0.70 \times 20\text{ ms}) = 2.4 + 14.0 = 16.4\text{ ms} = 16,400,000\text{ ns}$$
* EAT equation:
  $$\text{EAT} = (1 - p) \cdot 80 + p \cdot 16,400,000 \le 160$$
  $$80 + p \cdot (16,399,920) \le 160$$
  $$p \cdot 16,399,920 \le 80 \implies p \le \frac{80}{16,399,920} \approx 4.878 \times 10^{-6}$$
* **Answer:** `4.88 x 10^-6` (or `0.00000488`)

### Solution to Problem 7:
* To guarantee freedom from deadlock using worst-case allocation bounds:
  $$\sum \text{Max\_Demand}_i - N \le R - 1$$
* Each process demands maximum 3 instances; maximum allocation before acquisition is \(3 - 1 = 2\) instances.
  $$N \times (3 - 1) + 1 \le R$$
  $$2N + 1 \le 6 \implies 2N \le 5 \implies N \le 2.5 \implies N_{max} = 2$$
* **Answer:** `2`

### Solution to Problem 8:
* \(T_{\text{seek}} = 6\text{ ms}\).
* Rotational speed = \(7200\text{ RPM} \implies 120\text{ rev/sec}\). Time per revolution = \(\frac{1}{120}\text{ s} = 8.333\text{ ms}\).
  $$\text{Average Rotational Latency } T_{\text{rot}} = \frac{8.333}{2} = 4.167\text{ ms}$$
* Transfer rate = \(50\text{ MB/s} = 50,000\text{ KB/s}\).
  $$T_{\text{transfer}} = \frac{16\text{ KB}}{50,000\text{ KB/s}} = 0.00032\text{ sec} = 0.32\text{ ms}$$
* Total Access Time = \(6.0 + 4.167 + 0.32 = 10.487\text{ ms}\).
* **Answer:** `10.49` ms

### Solution to Problem 9:
* A hard link points to the underlying Inode, retaining access to file data even if the original directory entry is removed. A symbolic link points to the path string and breaks when the original file is deleted.
* **Answer:** `(A)`

### Solution to Problem 10:
* Requests: `[98, 183, 37, 122, 14, 124, 65, 67]`. Initial head position = 53.
* Sorted requests: `[14, 37, 53 (head), 65, 67, 98, 122, 124, 183]`.
* Moving upward:
  * Serves: \(53 \to 65 \to 67 \to 98 \to 122 \to 124 \to 183\).
  * Distance moved upward = \(183 - 53 = 130\).
* C-LOOK jumps from highest request (183) directly to lowest request (14) without servicing tracks in between (distance tracked in standard C-LOOK counting = head resets to 14).
* Serves upward from 14: \(14 \to 37\).
  * Distance moved = \(37 - 14 = 23\).
* Total head movement = \((183 - 53) + (37 - 14) = 130 + 23 = 153\) tracks.
* **Answer:** `153`