#!/usr/bin/env python3
"""
ResourceCollectorAgent:
Curates standard authoritative reference textbooks, NPTEL video courses, MIT OCW / YouTube lectures,
research surveys, and open-source simulation tools for B.Tech & Industry Engineering subjects.
"""

from typing import Dict, List, Any

KNOWLEDGE_CATALOG: Dict[str, Dict[str, Any]] = {
    "vlsi": {
        "textbooks": [
            {
                "title": "CMOS VLSI Design: A Circuits and Systems Perspective",
                "authors": "Neil H. E. Weste, David Money Harris",
                "publisher": "Pearson",
                "edition": "4th Edition",
                "code": "T1",
                "relevance": "Primary authoritative textbook for MOS transistor physics, dynamic logic, logical effort, static timing analysis (STA), and datapath design."
            },
            {
                "title": "Digital Integrated Circuits: A Design Perspective",
                "authors": "Jan M. Rabaey, Anantha Chandrakasan, Borivoje Nikolic",
                "publisher": "Pearson",
                "edition": "2nd Edition",
                "code": "T2",
                "relevance": "In-depth coverage of CMOS inverter characteristics, propagation delay metrics, dynamic logic, and 6T SRAM/DRAM memory architectures."
            }
        ],
        "references": [
            {
                "title": "CMOS Digital Integrated Circuits: Analysis and Design",
                "authors": "Sung-Mo Kang, Yusuf Leblebici",
                "publisher": "McGraw-Hill",
                "edition": "4th Edition",
                "code": "R1"
            },
            {
                "title": "Static Timing Analysis for Nanometer Designs: A Practical Approach",
                "authors": "J. Bhasker, Rakesh Chadha",
                "publisher": "Springer",
                "edition": "1st Edition",
                "code": "R2"
            }
        ],
        "video_lectures": [
            {
                "platform": "NPTEL (IIT Madras)",
                "course_name": "VLSI Design & Digital IC Architecture",
                "instructor": "Prof. Nandita Dasgupta & Prof. S. Srinivasan",
                "url": "https://nptel.ac.in/courses/117106092",
                "modules_count": 40
            },
            {
                "platform": "MIT OpenCourseWare (OCW)",
                "course_name": "6.374 Analysis and Design of Digital Integrated Circuits",
                "instructor": "Prof. Anantha Chandrakasan",
                "url": "https://ocw.mit.edu/courses/6-374-analysis-and-design-of-digital-integrated-circuits-fall-2003/",
                "modules_count": 24
            }
        ],
        "simulation_tools": ["Cadence Virtuoso / Innovus", "Synopsys Design Compiler / PrimeTime", "OpenROAD / Yosys Open-Source EDA", "ModelSim / Icarus Verilog", "Magic VLSI / NGSPICE"]
    },
    "dsp": {
        "textbooks": [
            {
                "title": "Discrete-Time Signal Processing",
                "authors": "Alan V. Oppenheim, Ronald W. Schafer",
                "publisher": "Pearson",
                "edition": "3rd Edition",
                "code": "T1",
                "relevance": "Definitive textbook for DTFT, Z-Transform, DFT/FFT, FIR/IIR digital filter design, and multirate DSP."
            },
            {
                "title": "Digital Signal Processing: Principles, Algorithms, and Applications",
                "authors": "John G. Proakis, Dimitris G. Manolakis",
                "publisher": "Pearson",
                "edition": "4th Edition",
                "code": "T2",
                "relevance": "Algorithm formulation, Fast Fourier Transforms, finite wordlength effects, and realization structures."
            }
        ],
        "references": [
            {
                "title": "Digital Signal Processing: A Computer-Based Approach",
                "authors": "Sanjit K. Mitra",
                "publisher": "McGraw-Hill",
                "edition": "4th Edition",
                "code": "R1"
            }
        ],
        "video_lectures": [
            {
                "platform": "NPTEL (IIT Delhi)",
                "course_name": "Digital Signal Processing",
                "instructor": "Prof. S. C. Dutta Roy",
                "url": "https://nptel.ac.in/courses/117102060",
                "modules_count": 40
            },
            {
                "platform": "MIT OpenCourseWare (OCW)",
                "course_name": "6.341 Discrete-Time Signal Processing",
                "instructor": "Prof. Alan V. Oppenheim",
                "url": "https://ocw.mit.edu/courses/6-341-discrete-time-signal-processing-fall-2005/",
                "modules_count": 26
            }
        ],
        "simulation_tools": ["SciPy Signal (scipy.signal)", "MATLAB DSP System Toolbox", "GNU Octave Signal Package", "KaTeX DSP Interactive Portal"]
    },
    "ml": {
        "textbooks": [
            {
                "title": "Pattern Recognition and Machine Learning",
                "authors": "Christopher M. Bishop",
                "publisher": "Springer",
                "edition": "1st Edition",
                "code": "T1",
                "relevance": "Foundational mathematical formulations: Bayesian inference, Linear Models, SVMs, Neural Networks, EM Algorithm."
            },
            {
                "title": "Machine Learning: A Probabilistic Perspective",
                "authors": "Kevin P. Murphy",
                "publisher": "MIT Press",
                "edition": "1st Edition",
                "code": "T2",
                "relevance": "Probabilistic graphical models, optimization, ensemble methods (AdaBoost, XGBoost), and deep learning."
            }
        ],
        "references": [
            {
                "title": "Deep Learning",
                "authors": "Ian Goodfellow, Yoshua Bengio, Aaron Courville",
                "publisher": "MIT Press",
                "edition": "1st Edition",
                "code": "R1"
            }
        ],
        "video_lectures": [
            {
                "platform": "NPTEL (IIT Madras)",
                "course_name": "Introduction to Machine Learning",
                "instructor": "Prof. Balaraman Ravindran",
                "url": "https://nptel.ac.in/courses/106106139",
                "modules_count": 40
            },
            {
                "platform": "Stanford Online / YouTube",
                "course_name": "CS229 Machine Learning",
                "instructor": "Prof. Andrew Ng",
                "url": "https://www.youtube.com/playlist?list=PLoROMvodv4rMiGQp3WXShtMGgzqpfVfbU",
                "modules_count": 20
            }
        ],
        "simulation_tools": ["Scikit-Learn", "PyTorch", "TensorFlow", "JAX / NumPy", "iMentor Interactive Visualizer"]
    },
    "control": {
        "textbooks": [
            {
                "title": "Modern Control Engineering",
                "authors": "Katsuhiko Ogata",
                "publisher": "Pearson",
                "edition": "5th Edition",
                "code": "T1",
                "relevance": "Standard curriculum text for Root Locus, Bode plots, Nyquist stability, State-Space analysis and PID design."
            },
            {
                "title": "Control Systems Engineering",
                "authors": "Norman S. Nise",
                "publisher": "Wiley",
                "edition": "8th Edition",
                "code": "T2",
                "relevance": "Practical control design, time-domain specs, frequency domain techniques, and compensators."
            }
        ],
        "references": [
            {
                "title": "Automatic Control Systems",
                "authors": "Farid Golnaraghi, Benjamin C. Kuo",
                "publisher": "McGraw-Hill",
                "edition": "10th Edition",
                "code": "R1"
            }
        ],
        "video_lectures": [
            {
                "platform": "NPTEL (IIT Madras)",
                "course_name": "Control Engineering",
                "instructor": "Prof. Ramkrishna Pasumarthy",
                "url": "https://nptel.ac.in/courses/108106098",
                "modules_count": 40
            },
            {
                "platform": "MIT OpenCourseWare (OCW)",
                "course_name": "2.04A Systems and Controls",
                "instructor": "Prof. Neville Hogan",
                "url": "https://ocw.mit.edu/courses/2-04a-systems-and-controls-spring-2013/",
                "modules_count": 25
            }
        ],
        "simulation_tools": ["Python Control Systems Library (control-toolbox)", "MATLAB Simulink", "GNU Octave Control Package"]
    },
    "power_electronics": {
        "textbooks": [
            {
                "title": "Power Electronics: Converters, Applications, and Design",
                "authors": "Ned Mohan, Tore M. Undeland, William P. Robbins",
                "publisher": "Wiley",
                "edition": "3rd Edition",
                "code": "T1",
                "relevance": "Thyristor/IGBT/MOSFET physics, DC-DC Buck/Boost converters, PWM inverters, and AC voltage controllers."
            },
            {
                "title": "Fundamentals of Power Electronics",
                "authors": "Robert W. Erickson, Dragan Maksimovic",
                "publisher": "Springer",
                "edition": "3rd Edition",
                "code": "T2",
                "relevance": "State-space averaging, circuit equivalent modeling, and magnetics design."
            }
        ],
        "references": [
            {
                "title": "Power Electronics: Circuits, Devices and Applications",
                "authors": "Muhammad H. Rashid",
                "publisher": "Pearson",
                "edition": "4th Edition",
                "code": "R1"
            }
        ],
        "video_lectures": [
            {
                "platform": "NPTEL (IIT Delhi / IISc)",
                "course_name": "Power Electronics",
                "instructor": "Prof. G. Bhuvaneswari",
                "url": "https://nptel.ac.in/courses/108101038",
                "modules_count": 40
            },
            {
                "platform": "University of Colorado Boulder / Coursera",
                "course_name": "Introduction to Power Electronics",
                "instructor": "Prof. Robert Erickson",
                "url": "https://www.coursera.org/learn/power-electronics",
                "modules_count": 16
            }
        ],
        "simulation_tools": ["PLECS", "PSIM", "MATLAB Simscape Power Systems", "LTSpice XVII"]
    },
    "circuits": {
        "textbooks": [
            {
                "title": "Fundamentals of Electric Circuits",
                "authors": "Charles K. Alexander, Matthew N. O. Sadiku",
                "publisher": "McGraw-Hill Education",
                "edition": "7th Edition",
                "code": "T1",
                "relevance": "Primary textbook for nodal/mesh analysis, AC network analysis, resonance, and Laplace network synthesis."
            },
            {
                "title": "Engineering Circuit Analysis",
                "authors": "William H. Hayt, Jack E. Kemmerly, Steven M. Durbin",
                "publisher": "McGraw-Hill",
                "edition": "9th Edition",
                "code": "T2",
                "relevance": "Comprehensive coverage of transient response, two-port networks, and coupled circuits."
            }
        ],
        "references": [
            {
                "title": "Electric Circuits",
                "authors": "James W. Nilsson, Susan A. Riedel",
                "publisher": "Pearson",
                "edition": "11th Edition",
                "code": "R1"
            }
        ],
        "video_lectures": [
            {
                "platform": "NPTEL (IIT Madras)",
                "course_name": "Basic Electrical Circuits",
                "instructor": "Prof. Nagendra Krishnapura",
                "url": "https://nptel.ac.in/courses/108106172",
                "modules_count": 40
            },
            {
                "platform": "MIT OpenCourseWare (OCW)",
                "course_name": "6.002 Circuits and Electronics",
                "instructor": "Prof. Anant Agarwal",
                "url": "https://ocw.mit.edu/courses/6-002-circuits-and-electronics-spring-2007/",
                "modules_count": 25
            }
        ],
        "simulation_tools": ["LTSpice", "MATLAB Simscape", "Falstad Circuit Simulator", "TINA-TI"]
    }
}


class ResourceCollectorAgent:
    """Agent that curates standard textbooks, NPTEL/OCW video links, and tools for an engineering subject."""

    def __init__(self):
        self.catalog = KNOWLEDGE_CATALOG

    def _match_category(self, subject_name: str, description: str = "") -> str:
        s = (subject_name + " " + description).lower()
        if any(k in s for k in ["vlsi", "cmos", "digital ic", "asic", "timing slack", "sram", "layout", "verilog"]):
            return "vlsi"
        if any(k in s for k in ["machine learning", "ml", "neural", "classification", "regression", "svm", "deep learning", "clustering", "pca"]):
            return "ml"
        if any(k in s for k in ["signal", "dsp", "discrete", "fourier", "filter", "z-transform"]):
            return "dsp"
        if any(k in s for k in ["control", "bode", "nyquist", "root locus", "state-space", "pid", "transfer function"]):
            return "control"
        if any(k in s for k in ["power electronic", "converter", "inverter", "chopper", "rectifier", "igbt", "thyristor"]):
            return "power_electronics"
        if any(k in s for k in ["circuit", "network", "mesh", "nodal", "thevenin", "kvl", "kcl"]):
            return "circuits"
        return "circuits"

    def collect(self, course_code: str, subject_name: str, description: str = "") -> Dict[str, Any]:
        cat_key = self._match_category(subject_name, description)
        data = self.catalog.get(cat_key, self.catalog["circuits"])

        return {
            "course_code": course_code,
            "subject_name": subject_name,
            "category": cat_key,
            "textbooks": data["textbooks"],
            "references": data["references"],
            "video_lectures": data["video_lectures"],
            "nptel_courses": data["video_lectures"],
            "simulation_tools": data["simulation_tools"],
            "interactive_sandbox_available": True,
            "suggested_prerequisites": [
                "Engineering Mathematics (Calculus, Linear Algebra, Differential Equations)",
                "Fundamental Physics (Electromagnetism, Solid State & Systems Theory)"
            ]
        }
